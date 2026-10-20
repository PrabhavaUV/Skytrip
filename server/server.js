const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());                  // See DEBUG_LOG.md → ERR-005 if CORS errors appear
app.use(express.json());          // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: false }));

// ── Serve Compiled React Frontend ────────────────────────────────────────────
// Webpack outputs app.bundle.js into /public — Express serves it as static files
app.use(express.static(path.join(__dirname, '../public')));

// ── API Routes ───────────────────────────────────────────────────────────────
// Member 1 (Auth & Wallet) — uncomment when auth routes are implemented:
// const authRoutes   = require('./routes/authRoutes');
// const walletRoutes = require('./routes/walletRoutes');
// app.use('/api/auth',   authRoutes);
// app.use('/api/wallet', walletRoutes);

// Member 2 (Flights & Admin) — uncomment when flight routes are implemented:
// const flightRoutes = require('./routes/flightRoutes');
// app.use('/api/flights', flightRoutes);

// Member 3 (Seats) — uncomment when seat routes are implemented:
// const seatRoutes = require('./routes/seatRoutes');
// app.use('/api/seats', seatRoutes);

// Member 4 (Bookings) — uncomment when booking routes are implemented:
// const bookingRoutes = require('./routes/bookingRoutes');
// app.use('/api/bookings', bookingRoutes);

// ── React SPA Fallback ───────────────────────────────────────────────────────
// Any non-API request gets the index.html so React Router handles client-side navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Central Error Handler ────────────────────────────────────────────────────
// Must be mounted LAST — catches errors passed via next(err) from any route
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✈️  Skytrip server running → http://localhost:${PORT}`);
});
