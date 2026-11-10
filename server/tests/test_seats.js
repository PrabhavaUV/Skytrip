/**
 * Automated Verification Script — Member 3: Cabin Seats & Passenger Registry
 * Run with: npm run test:seats (or node server/tests/test_seats.js)
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const { validateAadhaar, validatePassport, checkDuplicatePassengers } = require('../utils/passengerValidator');

const BASE_URL = 'http://localhost:5000';
let serverProcess = null;

const isServerRunning = () => {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('\n=============================================');
  console.log('💺 Skytrip Member 3 Cabin Seats & Hold API Test');
  console.log('=============================================\n');

  const running = await isServerRunning();
  if (!running) {
    console.log('⚡ Server not running on :5000, starting background instance...');
    serverProcess = spawn('node', [path.join(__dirname, '../server.js')], {
      stdio: 'pipe',
      env: process.env,
    });

    let attempts = 0;
    while (attempts < 20) {
      await wait(500);
      if (await isServerRunning()) break;
      attempts++;
    }

    if (!(await isServerRunning())) {
      console.error('❌ Failed to start server on port 5000 within 10 seconds.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  }

  let token = null;
  const testEmail = `seat_tester_${Date.now()}@skytrip.com`;
  const testPassword = 'Password@123';

  try {
    // ── Setup: Authenticate to get JWT token ─────────────────────
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Seat Map Tester',
        email: testEmail,
        password: testPassword,
        phone: '9876500000',
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.token) {
      throw new Error(`Failed to obtain auth token: ${JSON.stringify(regData)}`);
    }
    token = regData.token;

    // ── Setup: Retrieve flight with seats ────────────────────────
    const flightsRes = await fetch(`${BASE_URL}/api/flights?from=BLR&to=DEL`);
    const flightsData = await flightsRes.json();
    if (!flightsData.success || !flightsData.flights || flightsData.flights.length === 0) {
      throw new Error('No flights found between BLR and DEL. Ensure seed data is loaded.');
    }

    const testFlightId = flightsData.flights[0].id || flightsData.flights[0]._id;
    const flightDetailRes = await fetch(`${BASE_URL}/api/flights/${testFlightId}`);
    const flightDetailData = await flightDetailRes.json();
    const flightDoc = flightDetailData.flight;

    if (!flightDoc.seats || flightDoc.seats.length < 2) {
      throw new Error(`Flight ${flightDoc.flightNumber} has no seats. Re-run npm run seed.`);
    }

    const seat1 = flightDoc.seats[0].seatNumber;
    const seat2 = flightDoc.seats[1].seatNumber;

    // ── Test 1: Hold Seats ──────────────────────────────────────
    console.log(`Test 1: POST /api/seats/hold (Hold seats ${seat1}, ${seat2})`);
    const holdRes = await fetch(`${BASE_URL}/api/seats/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        flightId: testFlightId,
        seatNumbers: [seat1, seat2],
      }),
    });

    const holdData = await holdRes.json();
    if (holdRes.status !== 200 || !holdData.success) {
      throw new Error(`Hold failed with status ${holdRes.status}: ${JSON.stringify(holdData)}`);
    }

    const heldUntilDate = new Date(holdData.heldUntil);
    if (isNaN(heldUntilDate.getTime()) || heldUntilDate <= new Date()) {
      throw new Error(`Expected future heldUntil date, received: ${holdData.heldUntil}`);
    }

    console.log(`  ✅ 200 OK — Successfully held seats [${holdData.heldSeats.join(', ')}] until ${holdData.heldUntil} (Duration: ${holdData.holdDurationSeconds}s).`);

    // ── Test 2: Double-Hold Conflict Detection ──────────────────
    console.log(`Test 2: POST /api/seats/hold (Attempt to re-hold already locked seats)`);
    const conflictRes = await fetch(`${BASE_URL}/api/seats/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        flightId: testFlightId,
        seatNumbers: [seat1],
      }),
    });

    const conflictData = await conflictRes.json();
    if (conflictRes.status !== 409 || conflictData.success !== false) {
      throw new Error(`Expected 409 Conflict, received status ${conflictRes.status}: ${JSON.stringify(conflictData)}`);
    }
    console.log(`  ✅ 409 Conflict — Correctly prevented double-hold: "${conflictData.message}".`);

    // ── Test 3: Release Held Seats ──────────────────────────────
    console.log(`Test 3: POST /api/seats/release (Release seats ${seat1}, ${seat2})`);
    const releaseRes = await fetch(`${BASE_URL}/api/seats/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        flightId: testFlightId,
        seatNumbers: [seat1, seat2],
      }),
    });

    const releaseData = await releaseRes.json();
    if (releaseRes.status !== 200 || !releaseData.success) {
      throw new Error(`Release failed with status ${releaseRes.status}: ${JSON.stringify(releaseData)}`);
    }
    console.log(`  ✅ 200 OK — Successfully released seats: "${releaseData.message}".`);

    // ── Test 4: Re-hold After Release ───────────────────────────
    console.log(`Test 4: POST /api/seats/hold (Re-hold previously released seats)`);
    const reholdRes = await fetch(`${BASE_URL}/api/seats/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        flightId: testFlightId,
        seatNumbers: [seat1, seat2],
      }),
    });

    const reholdData = await reholdRes.json();
    if (reholdRes.status !== 200 || !reholdData.success) {
      throw new Error(`Re-hold failed with status ${reholdRes.status}: ${JSON.stringify(reholdData)}`);
    }
    console.log(`  ✅ 200 OK — Seats were confirmed AVAILABLE and successfully held again.`);

    // Clean up seats by releasing
    await fetch(`${BASE_URL}/api/seats/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        flightId: testFlightId,
        seatNumbers: [seat1, seat2],
      }),
    });

    // ── Test 5: Passenger Validator Verification ────────────────
    console.log('Test 5: Passenger Validation & Duplicate Rules');
    if (!validateAadhaar('123456789012') || validateAadhaar('1234') || validateAadhaar('12345678901A')) {
      throw new Error('Aadhaar regex validation failed');
    }
    if (!validatePassport('A1234567') || !validatePassport('') || validatePassport('invalid!')) {
      throw new Error('Passport regex validation failed');
    }

    const duplicateCheck = checkDuplicatePassengers([
      { aadhaarNumber: '123456789012', phone: '9999999999' },
      { aadhaarNumber: '123456789012', phone: '8888888888' },
    ]);
    if (duplicateCheck.valid !== false) {
      throw new Error('Failed to detect duplicate Aadhaar across passengers');
    }
    console.log('  ✅ Verified — Aadhaar 12-digit rule and duplicate passenger detection verified.');

    console.log('\n=============================================');
    console.log('🎉 ALL MEMBER 3 SEAT & REGISTRY TESTS PASSED!');
    console.log('=============================================\n');

    if (serverProcess) serverProcess.kill();
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Test failed: ${err.message}\n`);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
}

runTests();
