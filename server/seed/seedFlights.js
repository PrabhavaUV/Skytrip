const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Flight = require('../models/Flight');

dotenv.config();

const flights = [
  {
    flightNumber: 'SKY-101',
    aircraftType: 'Boeing 737-800',
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 165), // +2h45m
    baseFare: 4500,
    taxes: 350,
    businessMultiplier: 1.6,
  },
  {
    flightNumber: 'SKY-102',
    aircraftType: 'Airbus A320neo',
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 360), // evening
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 525),
    baseFare: 5200,
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

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/skytrip';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding');

    await Flight.deleteMany({});
    console.log('🧹 Cleared existing flight catalog');

    const created = await Flight.insertMany(flights);
    console.log(`✅ Seeded ${created.length} flights into Skytrip catalog!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
}

seed();
