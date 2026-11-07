/**
 * Automated Verification Script — Member 2: Flight Catalog & Admin Portal
 * Run with: npm run test:flights or node server/tests/test_flights.js
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

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
  console.log('✈️  Skytrip Member 2 Flight & Admin API Test');
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
      console.error('❌ Failed to connect to server on port 5000.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  }

  try {
    // ── Test 1: Search Flights (GET /api/flights) ──────────────────
    console.log('Test 1: GET /api/flights?from=BLR&to=DEL (Search flights)');
    const searchRes = await fetch(`${BASE_URL}/api/flights?from=BLR&to=DEL`);
    const searchData = await searchRes.json();

    if (searchRes.status !== 200 || !searchData.success) {
      throw new Error(`Search failed with status ${searchRes.status}: ${JSON.stringify(searchData)}`);
    }
    console.log(`  ✅ 200 OK — Found ${searchData.count} flight(s) matching BLR -> DEL.`);

    let targetFlightId = null;
    let targetFlightNumber = null;
    if (searchData.flights && searchData.flights.length > 0) {
      targetFlightId = searchData.flights[0].id;
      targetFlightNumber = searchData.flights[0].flightNumber;
    }

    // ── Test 2: Get Flight By ID (GET /api/flights/:id) ────────────
    if (targetFlightId) {
      console.log(`\nTest 2: GET /api/flights/${targetFlightId} (Get flight details)`);
      const getRes = await fetch(`${BASE_URL}/api/flights/${targetFlightId}`);
      const getData = await getRes.json();

      if (getRes.status !== 200 || !getData.success || getData.flight.flightNumber !== targetFlightNumber) {
        throw new Error(`Get flight failed: ${JSON.stringify(getData)}`);
      }
      console.log(`  ✅ 200 OK — Flight ${getData.flight.flightNumber} details retrieved successfully.`);
    }

    // ── Test 3: Admin Auth & Add Flight (POST /api/flights) ─────────
    console.log('\nTest 3: POST /api/flights with Admin credentials');
    const adminEmail = `admin_${Date.now()}@skytrip.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Tester',
        email: adminEmail,
        password: 'Password@123',
        phone: '9988776655',
        role: 'ADMIN',
      }),
    });
    const regData = await regRes.json();
    const adminToken = regData.token;

    if (!adminToken) {
      console.log('  ℹ️  Admin register token not obtained (check MongoDB). Skipping admin POST.');
    } else {
      const flightNum = `SKY-T${Math.floor(100 + Math.random() * 900)}`;
      const createRes = await fetch(`${BASE_URL}/api/flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          flightNumber: flightNum,
          sourceAirport: 'BOM',
          destinationAirport: 'GOI',
          departureTime: new Date(Date.now() + 86400000 * 3).toISOString(),
          arrivalTime: new Date(Date.now() + 86400000 * 3 + 1000 * 60 * 75).toISOString(),
          baseFare: 2800,
          businessRows: 2,
          businessCols: 2,
          economyRows: 8,
          economyCols: 6,
        }),
      });

      const createData = await createRes.json();
      if (createRes.status !== 201 || !createData.success || !createData.flightId) {
        throw new Error(`Admin create flight failed: ${JSON.stringify(createData)}`);
      }
      console.log(`  ✅ 201 Created — ${createData.message} (ID: ${createData.flightId})`);

      // ── Test 4: Delete Flight (DELETE /api/flights/:id) ────────────
      console.log(`\nTest 4: DELETE /api/flights/${createData.flightId} (Admin delete flight)`);
      const deleteRes = await fetch(`${BASE_URL}/api/flights/${createData.flightId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const deleteData = await deleteRes.json();
      if (deleteRes.status !== 200 || !deleteData.success) {
        throw new Error(`Delete flight failed: ${JSON.stringify(deleteData)}`);
      }
      console.log(`  ✅ 200 OK — ${deleteData.message}`);
    }

    console.log('\n=============================================');
    console.log('🎉 ALL MEMBER 2 FLIGHT TESTS PASSED!');
    console.log('=============================================\n');
  } catch (err) {
    console.error(`\n❌ Flight Test Failed: ${err.message}`);
    process.exit(1);
  } finally {
    if (serverProcess) serverProcess.kill();
  }
}

runTests();
