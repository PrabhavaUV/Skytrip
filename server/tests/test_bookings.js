/**
 * Automated Verification Script - Member 4: Bookings, Checkout and Tiered Refunds
 * Run with: npm run test:bookings (or node server/tests/test_bookings.js)
 *
 * Needs MongoDB running. Starts the server on :5000 if it is not already up.
 *
 * Part A checks the refund calculator on its own (no server needed).
 * Part B runs the full booking flow against the real API:
 *   register users -> admin creates flight -> hold seats -> pay -> list -> view -> cancel
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { calculateRefund } = require('../utils/refundCalculator');

const BASE_URL = 'http://localhost:5000';
const HOUR = 60 * 60 * 1000;
let serverProcess = null;
let passed = 0;

/* ── Tiny test helpers ──────────────────────────────────────── */

const check = (condition, description) => {
  if (!condition) throw new Error(`FAILED: ${description}`);
  passed++;
  console.log(`  ✅ ${description}`);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isServerRunning = () =>
  new Promise((resolve) => {
    const req = http.get(BASE_URL, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });

/** Calls the API and returns { status, body } */
const api = async (method, url, token, body) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json() };
};

const registerUser = async (name, role) => {
  const { status, body } = await api('POST', '/api/auth/register', null, {
    name,
    email: `${name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}@skytrip.com`,
    password: 'Password@123',
    phone: '98765' + String(Date.now()).slice(-5),
    role
  });
  if (status !== 201 || !body.token) throw new Error(`Register failed: ${JSON.stringify(body)}`);
  return body.token;
};

/* ── Part A: refund calculator ──────────────────────────────── */

function testRefundCalculator() {
  console.log('\nPart A: refundCalculator.js');
  const now = new Date('2026-11-10T10:00:00Z');
  const inHours = (h) => new Date(now.getTime() + h * HOUR);

  check(calculateRefund(inHours(120), 4000, now).refundPercentage === 75, '120 hours left -> 75%');
  check(calculateRefund(inHours(96), 4000, now).refundPercentage === 75, 'exactly 96 hours -> 75%');
  check(calculateRefund(inHours(95.9), 4000, now).refundPercentage === 50, '95.9 hours -> 50%');
  check(calculateRefund(inHours(48), 4000, now).refundPercentage === 50, 'exactly 48 hours -> 50%');
  check(calculateRefund(inHours(30), 4000, now).refundPercentage === 25, '30 hours -> 25%');
  check(calculateRefund(inHours(23), 4000, now).refundPercentage === 0, '23 hours -> 0% (non-refundable)');
  check(calculateRefund(inHours(-5), 4000, now).hoursUntilDeparture === 0, 'departed flight shows 0 hours, not negative');
  check(calculateRefund(inHours(60), 4000, now).refundAmount === 2000, '50% of ₹4,000 = ₹2,000');
  check(calculateRefund(inHours(30), 1234.57, now).refundAmount === 308.64, 'refund rounded to paise (25% of ₹1,234.57 = ₹308.64)');
}

/* ── Part B: booking API flow ───────────────────────────────── */

async function testBookingApi() {
  console.log('\nPart B: booking API');

  const adminToken = await registerUser('Booking Admin', 'ADMIN');
  const userToken = await registerUser('Booking Tester', 'CUSTOMER');
  const otherToken = await registerUser('Other Tester', 'CUSTOMER');

  // Admin creates a flight departing in 100 hours -> cancellation should give 75%
  const flightNumber = `T4${String(Date.now()).slice(-5)}`;
  const departure = new Date(Date.now() + 100 * HOUR);
  const created = await api('POST', '/api/flights', adminToken, {
    flightNumber,
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: departure.toISOString(),
    arrivalTime: new Date(departure.getTime() + 3 * HOUR).toISOString(),
    baseFare: 3000,
    taxes: 350,
    businessRows: 0,
    economyRows: 2,
    economyCols: 6
  });
  check(created.status === 201, `admin created test flight ${flightNumber}`);
  const flightId = created.body.flightId;

  const getSeat = async (seatNumber) => {
    const { body } = await api('GET', `/api/flights/${flightId}`);
    return body.flight.seats.find((s) => s.seatNumber === seatNumber);
  };

  try {
    // E1A is a window seat (3000 + 150), E1B is an aisle seat (3000)
    const seatNumbers = ['E1A', 'E1B'];
    const expectedTotal = 3150 + 3000 + 350 * 2; // 6850
    const passengers = [
      { fullName: 'Asha Rao', age: 34, phone: '9000000001', aadhaarNumber: '123456789012', mealPreference: 'VEG', seatNumber: 'E1A' },
      { fullName: 'Ravi Rao', age: 36, phone: '9000000002', aadhaarNumber: '123456789013', mealPreference: 'NON_VEG', seatNumber: 'E1B' }
    ];

    const hold = await api('POST', '/api/seats/hold', userToken, { flightId, seatNumbers });
    check(hold.status === 200, 'held seats E1A and E1B');

    // 1. Booking a seat that was never held is refused
    const notHeld = await api('POST', '/api/bookings', userToken, {
      flightId,
      seatNumbers: ['E1C'],
      passengers: [{ ...passengers[0], seatNumber: 'E1C' }]
    });
    check(notHeld.status === 409, 'booking a seat that is not on HOLD returns 409');

    // 2. Invalid Aadhaar is refused
    const badAadhaar = await api('POST', '/api/bookings', userToken, {
      flightId,
      seatNumbers,
      passengers: [{ ...passengers[0], aadhaarNumber: '1234' }, passengers[1]]
    });
    check(badAadhaar.status === 400, 'invalid Aadhaar returns 400');

    // 3. New users get ₹5,000, the trip costs ₹6,850 -> insufficient balance
    const poor = await api('POST', '/api/bookings', userToken, { flightId, seatNumbers, passengers });
    check(poor.status === 400, 'insufficient balance returns 400');
    check(poor.body.message === 'Insufficient wallet balance. Short by ₹1,850.00', `message is "${poor.body.message}"`);

    const walletAfterFail = await api('GET', '/api/wallet', userToken);
    check(walletAfterFail.body.walletBalance === 5000, 'wallet untouched after failed payment (₹5,000)');
    check((await getSeat('E1A')).seatStatus === 'HOLD', 'seat still on HOLD after failed payment');

    // 4. Top up, then pay
    await api('POST', '/api/wallet/topup', userToken, { amount: 5000 });

    const booked = await api('POST', '/api/bookings', userToken, { flightId, seatNumbers, passengers });
    check(booked.status === 201, 'POST /api/bookings returns 201');
    const booking = booked.body.booking;
    check(/^SKY-\d{6}-[A-Z0-9]{5}$/.test(booking.bookingReference), `reference ${booking.bookingReference} has format SKY-YYMMDD-XXXXX`);
    check(booking.totalAmount === expectedTotal, `server charged ₹${booking.totalAmount} (seat prices + taxes)`);
    check(booking.status === 'CONFIRMED', 'booking status is CONFIRMED');
    check(JSON.stringify(booking.seats) === JSON.stringify(seatNumbers), 'response lists the booked seats');

    const walletAfterPay = await api('GET', '/api/wallet', userToken);
    check(walletAfterPay.body.walletBalance === 10000 - expectedTotal, `wallet debited to ₹${walletAfterPay.body.walletBalance}`);
    check(walletAfterPay.body.walletTransactions.some((t) => t.type === 'DEBIT' && t.amount === expectedTotal), 'DEBIT entry added to wallet ledger');
    check((await getSeat('E1A')).seatStatus === 'BOOKED', 'seat E1A is now BOOKED');

    // 5. My Bookings list
    const list = await api('GET', '/api/bookings/user', userToken);
    check(list.status === 200, 'GET /api/bookings/user returns 200');
    const listed = list.body.bookings.find((b) => b._id === booking.id);
    check(Boolean(listed), 'new booking appears in the list');
    check(listed.flightId.flightNumber === flightNumber, 'flight details are populated in the list');

    // 6. Single booking (e-ticket)
    const single = await api('GET', `/api/bookings/${booking.id}`, userToken);
    check(single.status === 200 && single.body.booking.bookingReference === booking.bookingReference, 'GET /api/bookings/:id returns the booking');
    check(single.body.booking.passengers.length === 2, 'booking has both passengers');

    const stranger = await api('GET', `/api/bookings/${booking.id}`, otherToken);
    check(stranger.status === 404, "another user cannot see this booking (404)");

    const strangerCancel = await api('POST', `/api/bookings/${booking.id}/cancel`, otherToken);
    check(strangerCancel.status === 404, "another user cannot cancel this booking (404)");

    // 7. Cancel -> 100 hours left -> 75% refund
    const cancel = await api('POST', `/api/bookings/${booking.id}/cancel`, userToken);
    check(cancel.status === 200, 'POST /api/bookings/:id/cancel returns 200');
    check([75, 50, 25, 0].includes(cancel.body.refundPercentage), `refundPercentage ${cancel.body.refundPercentage} is a valid tier`);
    check(cancel.body.refundPercentage === 75, '100 hours before departure gives 75%');
    const expectedRefund = expectedTotal * 0.75; // 5137.5
    check(cancel.body.refundAmount === expectedRefund, `refundAmount is ₹${expectedRefund}`);
    const expectedBalance = 10000 - expectedTotal + expectedRefund;
    check(cancel.body.newWalletBalance === expectedBalance, `newWalletBalance is ₹${expectedBalance}`);
    console.log(`     message: ${cancel.body.message}`);

    check((await getSeat('E1A')).seatStatus === 'AVAILABLE', 'seat E1A released back to AVAILABLE');

    // 8. Status is CANCELLED in the list
    const listAfter = await api('GET', '/api/bookings/user', userToken);
    const cancelledEntry = listAfter.body.bookings.find((b) => b._id === booking.id);
    check(cancelledEntry.status === 'CANCELLED', 'booking now shows CANCELLED');
    check(cancelledEntry.refundAmount === expectedRefund, 'refundAmount saved on the booking');

    // 9. Cancelling twice does not refund twice
    const again = await api('POST', `/api/bookings/${booking.id}/cancel`, userToken);
    check(again.status === 400, 'cancelling again returns 400');
    const finalWallet = await api('GET', '/api/wallet', userToken);
    check(finalWallet.body.walletBalance === expectedBalance, 'wallet not credited a second time');

    // 10. No token -> 401
    const noAuth = await api('GET', '/api/bookings/user');
    check(noAuth.status === 401, 'request without a token returns 401');
  } finally {
    // Clean up the test flight so it does not show up in searches
    await api('DELETE', `/api/flights/${flightId}`, adminToken);
  }
}

/* ── Runner ─────────────────────────────────────────────────── */

async function run() {
  console.log('\n=============================================');
  console.log('🎫 Skytrip Member 4 Bookings and Refunds Test');
  console.log('=============================================');

  try {
    testRefundCalculator();

    if (!(await isServerRunning())) {
      console.log('\n⚡ Server not running on :5000, starting a background instance...');
      serverProcess = spawn('node', [path.join(__dirname, '../server.js')], { stdio: 'pipe', env: process.env });
      for (let i = 0; i < 20 && !(await isServerRunning()); i++) await wait(500);
      if (!(await isServerRunning())) throw new Error('Server did not start on port 5000 within 10 seconds');
      await wait(1500); // give MongoDB a moment to connect
    }

    await testBookingApi();

    console.log(`\n🎉 All ${passed} checks passed. Milestone 4 verified.\n`);
    process.exitCode = 0;
  } catch (err) {
    console.error(`\n❌ ${err.message}`);
    console.error(`   (${passed} checks passed before the failure)\n`);
    process.exitCode = 1;
  } finally {
    if (serverProcess) serverProcess.kill();
  }
}

run();
