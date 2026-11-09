const mongoose = require('mongoose');

// ── Member 3: Embedded Seat Subdocument ──────────────────────
const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },         // e.g., 'E1A', 'B2C'
  seatClass:  { type: String, enum: ['ECONOMY', 'BUSINESS'], required: true },
  seatType:   { type: String, enum: ['WINDOW', 'AISLE', 'MIDDLE'], default: 'MIDDLE' },
  seatStatus: { type: String, enum: ['AVAILABLE', 'HOLD', 'BOOKED'], default: 'AVAILABLE' },
  heldUntil:  { type: Date, default: null },            // Tracks 5-minute hold expiry
  price:      { type: Number, required: true }
});

// ── Member 2: Core Flight Fields ──────────────────────────────
const flightSchema = new mongoose.Schema({
  flightNumber:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  aircraftType:       { type: String, default: 'Boeing 737' },
  sourceAirport:      { type: String, required: true, uppercase: true, trim: true },
  destinationAirport: { type: String, required: true, uppercase: true, trim: true },
  departureTime:      { type: Date, required: true },
  arrivalTime:        { type: Date, required: true },
  baseFare:           { type: Number, required: true },
  taxes:              { type: Number, default: 350 },
  businessMultiplier: { type: Number, default: 1.5 },
  seats:              [seatSchema]
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
