const mongoose = require('mongoose');
const Flight = require('../models/Flight');

/**
 * Hold Selected Seats for 5 Minutes
 * POST /api/seats/hold
 * Body: { flightId: string, seatNumbers: string[] }
 */
const holdSeats = async (req, res, next) => {
  try {
    const { flightId, seatNumbers } = req.body;

    if (!flightId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'flightId and a non-empty array of seatNumbers are required',
      });
    }

    let flight = null;
    if (mongoose.connection.readyState === 1) {
      flight = await Flight.findById(flightId);
    }

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found',
      });
    }

    // Step 1: Release any expired holds across the flight
    const now = new Date();
    if (Array.isArray(flight.seats)) {
      flight.seats.forEach((seat) => {
        if (seat.seatStatus === 'HOLD' && seat.heldUntil && new Date(seat.heldUntil) < now) {
          seat.seatStatus = 'AVAILABLE';
          seat.heldUntil = null;
        }
      });
    }

    // Step 2: Validate that all requested seats exist and are AVAILABLE
    for (const seatNum of seatNumbers) {
      const seat = flight.seats.find((s) => s.seatNumber === seatNum);
      if (!seat) {
        return res.status(404).json({
          success: false,
          message: `Seat ${seatNum} does not exist on this flight`,
        });
      }
      if (seat.seatStatus !== 'AVAILABLE') {
        return res.status(409).json({
          success: false,
          message: `Seat ${seatNum} is not available`,
        });
      }
    }

    // Step 3: Place 5-minute hold on all requested seats
    const holdDurationMs = 5 * 60 * 1000;
    const heldUntil = new Date(Date.now() + holdDurationMs);

    flight.seats.forEach((seat) => {
      if (seatNumbers.includes(seat.seatNumber)) {
        seat.seatStatus = 'HOLD';
        seat.heldUntil = heldUntil;
      }
    });

    await flight.save();

    return res.status(200).json({
      success: true,
      heldSeats: seatNumbers,
      heldUntil: heldUntil.toISOString(),
      holdDurationSeconds: 300,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Release Held Seats
 * POST /api/seats/release
 * Body: { flightId: string, seatNumbers: string[] }
 */
const releaseSeats = async (req, res, next) => {
  try {
    const { flightId, seatNumbers } = req.body;

    if (!flightId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'flightId and a non-empty array of seatNumbers are required',
      });
    }

    let flight = null;
    if (mongoose.connection.readyState === 1) {
      flight = await Flight.findById(flightId);
    }

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found',
      });
    }

    if (Array.isArray(flight.seats)) {
      flight.seats.forEach((seat) => {
        if (seatNumbers.includes(seat.seatNumber) && seat.seatStatus === 'HOLD') {
          seat.seatStatus = 'AVAILABLE';
          seat.heldUntil = null;
        }
      });
    }

    await flight.save();

    return res.status(200).json({
      success: true,
      message: 'Seats released successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  holdSeats,
  releaseSeats,
};
