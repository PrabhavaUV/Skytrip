const mongoose = require('mongoose');

// ── One passenger inside a booking ───────────────────────────
const passengerDetailSchema = new mongoose.Schema({
  fullName:       { type: String, required: true, trim: true },
  age:            { type: Number, required: true, min: 1, max: 120 },
  email:          { type: String, trim: true, lowercase: true },
  phone:          { type: String, trim: true },
  aadhaarNumber:  { type: String, required: true, trim: true },
  passportNumber: { type: String, trim: true },
  mealPreference: { type: String, default: 'VEG' },
  seatNumber:     { type: String, required: true }
});

// ── Booking (Member 4) ───────────────────────────────────────
const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true }, // SKY-YYMMDD-XXXXX
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  flightId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  passengers:       [passengerDetailSchema],
  seatNumbers:      [{ type: String, required: true }],
  totalAmount:      { type: Number, required: true },
  status:           { type: String, enum: ['CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
  refundAmount:     { type: Number, default: 0 },
  cancelledAt:      { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
