const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Flight = require('../models/Flight');
const User = require('../models/User');

dotenv.config();

const flights = [
  {
    flightNumber: 'SKY-101',
    aircraftType: 'Boeing 737-800',
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 1), // Tomorrow (matches default search date)
    arrivalTime: new Date(Date.now() + 86400000 * 1 + 1000 * 60 * 165), // +2h45m
    baseFare: 4500,
    taxes: 350,
    businessMultiplier: 1.6,
  },
  {
    flightNumber: 'SKY-102',
    aircraftType: 'Airbus A320neo',
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 1 + 1000 * 60 * 360), // Tomorrow evening
    arrivalTime: new Date(Date.now() + 86400000 * 1 + 1000 * 60 * 525),
    baseFare: 5200,
    taxes: 350,
    businessMultiplier: 1.5,
  },
  {
    flightNumber: 'SKY-103',
    aircraftType: 'Boeing 737-800',
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 165),
    baseFare: 4600,
    taxes: 350,
    businessMultiplier: 1.6,
  },
  {
    flightNumber: 'SKY-104',
    aircraftType: 'Airbus A320neo',
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 360),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 525),
    baseFare: 5300,
    taxes: 350,
    businessMultiplier: 1.5,
  },
  {
    flightNumber: 'SKY-205',
    aircraftType: 'Boeing 737 Max 8',
    sourceAirport: 'BOM',
    destinationAirport: 'GOI',
    departureTime: new Date(Date.now() + 86400000 * 3),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 1000 * 60 * 75), // 1h15m
    baseFare: 2900,
    taxes: 250,
    businessMultiplier: 1.4,
  },
  {
    flightNumber: 'SKY-308',
    aircraftType: 'Airbus A321neo',
    sourceAirport: 'DEL',
    destinationAirport: 'BOM',
    departureTime: new Date(Date.now() + 86400000 * 4),
    arrivalTime: new Date(Date.now() + 86400000 * 4 + 1000 * 60 * 130), // 2h10m
    baseFare: 4200,
    taxes: 350,
    businessMultiplier: 1.5,
  },
  {
    flightNumber: 'SKY-412',
    aircraftType: 'Boeing 737-800',
    sourceAirport: 'BLR',
    destinationAirport: 'BOM',
    departureTime: new Date(Date.now() + 86400000 * 2),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 100), // 1h40m
    baseFare: 3600,
    taxes: 300,
    businessMultiplier: 1.5,
  },
  {
    flightNumber: 'SKY-515',
    aircraftType: 'Airbus A320',
    sourceAirport: 'HYD',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 3),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 1000 * 60 * 135), // 2h15m
    baseFare: 3900,
    taxes: 320,
    businessMultiplier: 1.5,
  },
  {
    flightNumber: 'SKY-620',
    aircraftType: 'Airbus A321neo',
    sourceAirport: 'MAA',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 5),
    arrivalTime: new Date(Date.now() + 86400000 * 5 + 1000 * 60 * 170), // 2h50m
    baseFare: 4800,
    taxes: 350,
    businessMultiplier: 1.6,
  },
];

function generateSeats(baseFare, businessMultiplier = 1.5, businessRows = 2, businessCols = 2, economyRows = 8, economyCols = 6) {
  const seats = [];
  const colLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const numBaseFare = Number(baseFare);
  const numMultiplier = Number(businessMultiplier) || 1.5;
  const businessPrice = Math.round(numBaseFare * numMultiplier);

  for (let row = 1; row <= businessRows; row++) {
    for (let col = 0; col < businessCols; col++) {
      const seatType = (col === 0 || col === businessCols - 1) ? 'WINDOW' : 'AISLE';
      seats.push({
        seatNumber: `B${row}${colLabels[col]}`,
        seatClass: 'BUSINESS',
        seatType,
        seatStatus: 'AVAILABLE',
        price: seatType === 'WINDOW' ? businessPrice + 150 : businessPrice,
      });
    }
  }

  const economyPrice = numBaseFare;
  for (let row = 1; row <= economyRows; row++) {
    for (let col = 0; col < economyCols; col++) {
      let seatType = 'MIDDLE';
      if (col === 0 || col === economyCols - 1) seatType = 'WINDOW';
      else if (col === 1 || col === economyCols - 2) seatType = 'AISLE';
      seats.push({
        seatNumber: `E${row}${colLabels[col]}`,
        seatClass: 'ECONOMY',
        seatType,
        seatStatus: 'AVAILABLE',
        price: seatType === 'WINDOW' ? economyPrice + 150 : economyPrice,
      });
    }
  }
  return seats;
}

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/skytrip';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding');

    await Flight.deleteMany({});
    console.log('🧹 Cleared existing flight catalog');

    const flightsWithSeats = flights.map((flight) => ({
      ...flight,
      seats: generateSeats(flight.baseFare, flight.businessMultiplier),
    }));

    const created = await Flight.insertMany(flightsWithSeats);
    console.log(`✅ Seeded ${created.length} flights with full seat layouts into Skytrip catalog!`);

    // ── Seed Default Admin Account ──────────────────────────
    await User.deleteOne({ email: 'admin@skytrip.com' });
    const adminUser = new User({
      name: 'Skytrip Operations Admin',
      email: 'admin@skytrip.com',
      password: 'Admin@123',
      phone: '9876543210',
      role: 'ADMIN',
      walletBalance: 100000.00,
    });
    await adminUser.save();
    console.log('✅ Default Admin seeded: admin@skytrip.com (Password: Admin@123)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
}

seed();

