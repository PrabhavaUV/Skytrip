const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { calculateRefund } = require('../utils/refundCalculator');
const {
  validateAadhaar,
  validatePassport,
  checkDuplicatePassengers
} = require('../utils/passengerValidator');

/* ════════════════════════════════════════════════════════════════
 * Small helpers
 * ════════════════════════════════════════════════════════════════ */

/** Builds a booking reference like SKY-261110-A1B2C */
const generateBookingRef = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase().padEnd(5, '0');
  return `SKY-${yy}${mm}${dd}-${rand}`;
};

/** 7000 -> "7,000.00" (Indian number format) */
const formatRupees = (amount) =>
  Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Sends a { success: false, message } error response */
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

/** Flight fields shown on My Bookings and the e-ticket */
const FLIGHT_FIELDS =
  'flightNumber aircraftType sourceAirport destinationAirport departureTime arrivalTime';

/**
 * Checks the passenger list sent by the checkout page.
 * Returns an error message string, or null when everything is valid.
 */
const findPassengerError = (passengers, seatNumbers) => {
  if (!Array.isArray(passengers) || passengers.length !== seatNumbers.length) {
    return 'Please provide exactly one passenger for each selected seat';
  }

  for (const p of passengers) {
    if (!p.fullName || !String(p.fullName).trim()) {
      return 'Every passenger needs a full name';
    }
    const age = Number(p.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return `Invalid age for ${p.fullName}`;
    }
    if (!validateAadhaar(String(p.aadhaarNumber || '').trim())) {
      return `Aadhaar number for ${p.fullName} must be exactly 12 digits`;
    }
    if (!validatePassport(p.passportNumber)) {
      return `Passport number for ${p.fullName} must be 6-20 letters or digits`;
    }
    if (!seatNumbers.includes(p.seatNumber)) {
      return `Passenger ${p.fullName} is not assigned to one of the selected seats`;
    }
  }

  const duplicateCheck = checkDuplicatePassengers(passengers);
  if (!duplicateCheck.valid) return duplicateCheck.message;

  return null;
};

/* ════════════════════════════════════════════════════════════════
 * POST /api/bookings   (checkout)
 * Body: { flightId, seatNumbers: [], passengers: [] }
 *
 * Steps:
 *   1. Validate the request and the passengers
 *   2. Make sure every seat is still on HOLD (held on the flight page)
 *   3. Work out the price on the server (never trust the browser's total)
 *   4. Debit the wallet, mark seats BOOKED, save the booking
 *   5. If step 4 fails half-way, put the money and seats back
 * ════════════════════════════════════════════════════════════════ */
const createBooking = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      return fail(res, 503, 'Database is not connected. Bookings need MongoDB running.');
    }

    const { flightId, seatNumbers, passengers } = req.body;

    // ── 1. Validate input ────────────────────────────────────
    if (!isValidId(flightId)) {
      return fail(res, 400, 'A valid flightId is required');
    }
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return fail(res, 400, 'Please select at least one seat');
    }
    if (new Set(seatNumbers).size !== seatNumbers.length) {
      return fail(res, 400, 'The same seat was selected twice');
    }

    const passengerError = findPassengerError(passengers, seatNumbers);
    if (passengerError) return fail(res, 400, passengerError);

    // ── 2. Load the flight and check the seats ───────────────
    const flight = await Flight.findById(flightId);
    if (!flight) return fail(res, 404, 'Flight not found');

    if (new Date(flight.departureTime) <= new Date()) {
      return fail(res, 400, 'This flight has already departed');
    }

    const now = new Date();
    const chosenSeats = [];
    for (const seatNumber of seatNumbers) {
      const seat = flight.seats.find((s) => s.seatNumber === seatNumber);
      if (!seat) {
        return fail(res, 404, `Seat ${seatNumber} does not exist on this flight`);
      }
      const holdIsActive =
        seat.seatStatus === 'HOLD' && seat.heldUntil && new Date(seat.heldUntil) > now;
      if (!holdIsActive) {
        return fail(res, 409, `Seat ${seatNumber} is no longer held for you. Please select it again.`);
      }
      chosenSeats.push(seat);
    }

    // ── 3. Price: seat prices (window surcharge included) + taxes per seat ──
    // Same formula FlightDetails.jsx uses to show the total.
    const seatsTotal = chosenSeats.reduce((sum, seat) => sum + seat.price, 0);
    const taxesTotal = (flight.taxes || 350) * chosenSeats.length;
    const totalAmount = seatsTotal + taxesTotal;

    // ── 4a. Check the wallet ─────────────────────────────────
    const user = await User.findById(req.user.id);
    if (!user) return fail(res, 404, 'User not found');

    if (user.walletBalance < totalAmount) {
      const shortBy = totalAmount - user.walletBalance;
      return fail(res, 400, `Insufficient wallet balance. Short by ₹${formatRupees(shortBy)}`);
    }

    // ── 4b. Debit the wallet ─────────────────────────────────
    // The filter "walletBalance >= totalAmount" makes this safe even if two
    // payments arrive at the same time: only one of them can succeed.
    const debitedUser = await User.findOneAndUpdate(
      { _id: req.user.id, walletBalance: { $gte: totalAmount } },
      {
        $inc: { walletBalance: -totalAmount },
        $push: {
          walletTransactions: {
            type: 'DEBIT',
            amount: totalAmount,
            description: `Flight ${flight.flightNumber} (${seatNumbers.join(', ')})`
          }
        }
      },
      { new: true }
    );
    if (!debitedUser) {
      return fail(res, 400, 'Insufficient wallet balance');
    }

    // ── 4c. Book the seats and save the booking ──────────────
    try {
      chosenSeats.forEach((seat) => {
        seat.seatStatus = 'BOOKED';
        seat.heldUntil = null;
      });
      await flight.save();

      const booking = await Booking.create({
        bookingReference: generateBookingRef(),
        userId: req.user.id,
        flightId,
        passengers,
        seatNumbers,
        totalAmount,
        status: 'CONFIRMED'
      });

      return res.status(201).json({
        success: true,
        booking: {
          id: booking._id.toString(),
          bookingReference: booking.bookingReference,
          status: booking.status,
          totalAmount: booking.totalAmount,
          seats: booking.seatNumbers
        },
        newWalletBalance: debitedUser.walletBalance
      });
    } catch (saveError) {
      // ── 5. Something failed after we took the money: undo it ──
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { walletBalance: totalAmount },
        $push: {
          walletTransactions: {
            type: 'REFUND',
            amount: totalAmount,
            description: `Payment reversed, booking for flight ${flight.flightNumber} failed`
          }
        }
      });
      await Flight.updateOne(
        { _id: flightId },
        { $set: { 'seats.$[s].seatStatus': 'AVAILABLE', 'seats.$[s].heldUntil': null } },
        { arrayFilters: [{ 's.seatNumber': { $in: seatNumbers }, 's.seatStatus': 'BOOKED' }] }
      );
      throw saveError;
    }
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════
 * GET /api/bookings/user   (My Bookings list, newest first)
 * ════════════════════════════════════════════════════════════════ */
const getUserBookings = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      return fail(res, 503, 'Database is not connected. Bookings need MongoDB running.');
    }

    const bookings = await Booking.find({ userId: req.user.id })
      .populate('flightId', FLIGHT_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════
 * GET /api/bookings/:id   (one booking, used by the e-ticket page)
 * ════════════════════════════════════════════════════════════════ */
const getBookingById = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      return fail(res, 503, 'Database is not connected. Bookings need MongoDB running.');
    }
    if (!isValidId(req.params.id)) return fail(res, 404, 'Booking not found');

    // Filtering on userId means a user can only ever see their own bookings
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('flightId', FLIGHT_FIELDS);

    if (!booking) return fail(res, 404, 'Booking not found');

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════════════
 * POST /api/bookings/:id/cancel   (cancel with tiered refund)
 *
 * Steps:
 *   1. Find the booking (must belong to this user and be CONFIRMED)
 *   2. Work out the refund from the departure time
 *   3. Mark the booking CANCELLED
 *   4. Credit the refund to the wallet
 *   5. Free the seats so other people can book them
 * ════════════════════════════════════════════════════════════════ */
const cancelBooking = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      return fail(res, 503, 'Database is not connected. Bookings need MongoDB running.');
    }
    if (!isValidId(req.params.id)) return fail(res, 404, 'Booking not found');

    // ── 1. Find the booking ──────────────────────────────────
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
    if (!booking) return fail(res, 404, 'Booking not found');
    if (booking.status === 'CANCELLED') {
      return fail(res, 400, 'This booking is already cancelled');
    }

    const flight = await Flight.findById(booking.flightId);
    if (!flight) return fail(res, 404, 'The flight for this booking no longer exists');

    if (new Date(flight.departureTime) <= new Date()) {
      return fail(res, 400, 'This flight has already departed and cannot be cancelled');
    }

    // ── 2. Work out the refund ───────────────────────────────
    const { hoursUntilDeparture, refundPercentage, refundAmount } =
      calculateRefund(flight.departureTime, booking.totalAmount);

    // ── 3. Mark CANCELLED ────────────────────────────────────
    // The filter "status: CONFIRMED" stops a double click from refunding twice.
    const cancelled = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'CONFIRMED' },
      { $set: { status: 'CANCELLED', refundAmount, cancelledAt: new Date() } },
      { new: true }
    );
    if (!cancelled) return fail(res, 400, 'This booking is already cancelled');

    // ── 4. Credit the wallet (only if there is something to refund) ──
    let updatedUser;
    if (refundAmount > 0) {
      updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          $inc: { walletBalance: refundAmount },
          $push: {
            walletTransactions: {
              type: 'REFUND',
              amount: refundAmount,
              description: `Refund for ${booking.bookingReference} (${refundPercentage}%)`
            }
          }
        },
        { new: true }
      );
    } else {
      updatedUser = await User.findById(req.user.id);
    }

    // ── 5. Free the seats ────────────────────────────────────
    flight.seats.forEach((seat) => {
      if (booking.seatNumbers.includes(seat.seatNumber)) {
        seat.seatStatus = 'AVAILABLE';
        seat.heldUntil = null;
      }
    });
    await flight.save();

    const message = refundAmount > 0
      ? `Booking cancelled. ₹${formatRupees(refundAmount)} (${refundPercentage}%) has been refunded to your wallet.`
      : 'Booking cancelled. This booking was non-refundable (less than 24 hours to departure).';

    return res.status(200).json({
      success: true,
      status: 'CANCELLED',
      hoursUntilDeparture,
      refundPercentage,
      refundAmount,
      newWalletBalance: updatedUser ? updatedUser.walletBalance : null,
      message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  generateBookingRef
};
