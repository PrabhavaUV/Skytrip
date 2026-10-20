/**
 * Automated Verification Script — Member 1: Auth, User & Digital Wallet
 * Run with: npm run test:auth
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
let serverProcess = null;

// Helper to check if server is already running on port 5000
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
  console.log('\n========================================');
  console.log('🧪 Skytrip Member 1 Auth & Wallet Test');
  console.log('========================================\n');

  const running = await isServerRunning();
  if (!running) {
    console.log('⚡ Server not running on :5000, starting background instance...');
    serverProcess = spawn('node', [path.join(__dirname, '../server.js')], {
      stdio: 'pipe',
      env: process.env
    });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Skytrip server running')) {
        // ready
      }
    });

    let attempts = 0;
    while (attempts < 20) {
      await wait(500);
      if (await isServerRunning()) break;
      attempts++;
    }

    if (!(await isServerRunning())) {
      console.error('❌ Failed to start server on port 5000 within 10 seconds. Check MongoDB connection.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  }

  const testEmail = `test_${Date.now()}@skytrip.com`;
  const testPassword = 'Password@123';
  let token = null;

  try {
    // ── Test 1: Register New User ───────────────────────────
    console.log('Test 1: POST /api/auth/register (New User Creation)');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Passenger',
        email: testEmail,
        password: testPassword,
        phone: '9876543210'
      })
    });

    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.success || !regData.token) {
      throw new Error(`Register failed with status ${regRes.status}: ${JSON.stringify(regData)}`);
    }
    if (regData.user.walletBalance !== 5000) {
      throw new Error(`Expected initial wallet balance to be 5000, received: ${regData.user.walletBalance}`);
    }
    token = regData.token;
    console.log('  ✅ 201 Created — User registered, JWT issued, initial wallet ₹5,000 confirmed.');

    // ── Test 2: Login ────────────────────────────────────────
    console.log('Test 2: POST /api/auth/login (Credential Verification)');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.success || !loginData.token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`);
    }
    token = loginData.token;
    console.log('  ✅ 200 OK — Password verified, new JWT returned.');

    // ── Test 3: GET /api/auth/me (Protected Profile) ─────────
    console.log('Test 3: GET /api/auth/me (Protected Route Verification)');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const meData = await meRes.json();
    if (meRes.status !== 200 || !meData.success || meData.user.email !== testEmail) {
      throw new Error(`Get me failed: ${JSON.stringify(meData)}`);
    }
    console.log(`  ✅ 200 OK — Profile retrieved for ${meData.user.name} (Role: ${meData.user.role}).`);

    // ── Test 4: POST /api/wallet/topup (Atomic Balance Increment)
    console.log('Test 4: POST /api/wallet/topup (Add ₹1,000 to Wallet)');
    const topupRes = await fetch(`${BASE_URL}/api/wallet/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 1000 })
    });

    const topupData = await topupRes.json();
    if (topupRes.status !== 200 || !topupData.success || topupData.newBalance !== 6000) {
      throw new Error(`Top-up failed: expected 6000, received: ${JSON.stringify(topupData)}`);
    }
    console.log(`  ✅ 200 OK — Balance atomically updated to ₹${topupData.newBalance}.`);

    // ── Test 5: GET /api/wallet (Ledger Verification) ────────
    console.log('Test 5: GET /api/wallet (Transaction Ledger)');
    const walletRes = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const walletData = await walletRes.json();
    if (walletRes.status !== 200 || walletData.walletBalance !== 6000 || !walletData.walletTransactions.length) {
      throw new Error(`Wallet ledger check failed: ${JSON.stringify(walletData)}`);
    }
    console.log(`  ✅ 200 OK — Ledger contains ${walletData.walletTransactions.length} transaction entries.`);

    // ── Test 6: Unauthenticated 401 Rejection ────────────────
    console.log('Test 6: Protected Route Security Rejection');
    const unauthRes = await fetch(`${BASE_URL}/api/auth/me`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, received: ${unauthRes.status}`);
    }
    console.log('  ✅ 401 Unauthorized — Correctly blocked request without Bearer token.');

    console.log('\n========================================');
    console.log('🎉 ALL 6 MEMBER 1 VERIFICATION TESTS PASSED!');
    console.log('========================================\n');

  } catch (err) {
    console.error('\n❌ Test Failure:', err.message);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runTests();
