const mongoose = require('mongoose');

// NOTE: Member 3 will add the SeatSchema and `seats` field to this file.
// Do NOT add seat-related fields here — that is Member 3's responsibility.

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
  // seats: [seatSchema]  <-- Member 3 adds this line
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
