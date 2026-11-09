const mongoose = require('mongoose');
const Flight = require('../models/Flight');

// In-memory fallback dataset for seamless local development when MongoDB is offline
let memoryFlights = [
  {
    _id: '65d8f4a1b1c4a01234567891',
    id: '65d8f4a1b1c4a01234567891',
    flightNumber: 'SKY-101',
    aircraftType: 'Boeing 737-800',
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 165),
    baseFare: 4500,
    taxes: 350,
    businessMultiplier: 1.6,
    availableSeatsCount: 48,
    seats: [],
  },
  {
    _id: '65d8f4a1b1c4a01234567892',
    id: '65d8f4a1b1c4a01234567892',
    flightNumber: 'SKY-102',
    aircraftType: 'Airbus A320neo',
    sourceAirport: 'BLR',
    destinationAirport: 'DEL',
    departureTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 360),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 525),
    baseFare: 5200,
    taxes: 350,
    businessMultiplier: 1.5,
    availableSeatsCount: 8, // Low seats trigger badge
    seats: [],
  },
  {
    _id: '65d8f4a1b1c4a01234567893',
    id: '65d8f4a1b1c4a01234567893',
    flightNumber: 'SKY-205',
    aircraftType: 'Boeing 737 Max 8',
    sourceAirport: 'BOM',
    destinationAirport: 'GOI',
    departureTime: new Date(Date.now() + 86400000 * 3),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 1000 * 60 * 75),
    baseFare: 2900,
    taxes: 250,
    businessMultiplier: 1.4,
    availableSeatsCount: 35,
    seats: [],
  },
  {
    _id: '65d8f4a1b1c4a01234567894',
    id: '65d8f4a1b1c4a01234567894',
    flightNumber: 'SKY-308',
    aircraftType: 'Airbus A321neo',
    sourceAirport: 'DEL',
    destinationAirport: 'BOM',
    departureTime: new Date(Date.now() + 86400000 * 4),
    arrivalTime: new Date(Date.now() + 86400000 * 4 + 1000 * 60 * 130),
    baseFare: 4200,
    taxes: 350,
    businessMultiplier: 1.5,
    availableSeatsCount: 52,
    seats: [],
  },
  {
    _id: '65d8f4a1b1c4a01234567895',
    id: '65d8f4a1b1c4a01234567895',
    flightNumber: 'SKY-412',
    aircraftType: 'Boeing 737-800',
    sourceAirport: 'BLR',
    destinationAirport: 'BOM',
    departureTime: new Date(Date.now() + 86400000 * 2),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 1000 * 60 * 100),
    baseFare: 3600,
    taxes: 300,
    businessMultiplier: 1.5,
    availableSeatsCount: 44,
    seats: [],
  },
];

/**
 * Search Flights
 * GET /api/flights?from=BLR&to=DEL&date=2026-11-01&sort=price_asc
 */
const searchFlights = async (req, res, next) => {
  try {
    const { from, to, date, sort, timeBand } = req.query;

    let flightDocs = [];

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (from) query.sourceAirport = from.trim().toUpperCase();
      if (to) query.destinationAirport = to.trim().toUpperCase();
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        query.departureTime = { $gte: startOfDay, $lte: endOfDay };
      }

      let sortOptions = { departureTime: 1 };
      if (sort === 'price_asc') sortOptions = { baseFare: 1 };
      else if (sort === 'price_desc') sortOptions = { baseFare: -1 };
      else if (sort === 'departure_asc') sortOptions = { departureTime: 1 };

      flightDocs = await Flight.find(query).sort(sortOptions);
    } else {
      // In-memory fallback
      flightDocs = memoryFlights.filter((f) => {
        if (from && f.sourceAirport !== from.trim().toUpperCase()) return false;
        if (to && f.destinationAirport !== to.trim().toUpperCase()) return false;
        if (date) {
          const fDate = new Date(f.departureTime).toISOString().split('T')[0];
          if (fDate !== date) return false;
        }
        return true;
      });

      if (sort === 'price_asc') {
        flightDocs.sort((a, b) => a.baseFare - b.baseFare);
      } else if (sort === 'price_desc') {
        flightDocs.sort((a, b) => b.baseFare - a.baseFare);
      } else if (sort === 'departure_asc') {
        flightDocs.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
      }
    }

    // Time band filter
    if (timeBand) {
      flightDocs = flightDocs.filter((f) => {
        const hour = new Date(f.departureTime).getUTCHours();
        if (timeBand === 'morning') return hour >= 6 && hour < 12;
        if (timeBand === 'afternoon') return hour >= 12 && hour < 17;
        if (timeBand === 'evening') return hour >= 17 && hour < 21;
        if (timeBand === 'night') return hour >= 21 || hour < 6;
        return true;
      });
    }

    if (sort === 'duration_asc') {
      flightDocs.sort((a, b) => {
        const durationA = new Date(a.arrivalTime) - new Date(a.departureTime);
        const durationB = new Date(b.arrivalTime) - new Date(b.departureTime);
        return durationA - durationB;
      });
    }

    const flights = flightDocs.map((f) => {
      const availableSeats =
        typeof f.availableSeatsCount === 'number'
          ? f.availableSeatsCount
          : Array.isArray(f.seats)
          ? f.seats.filter((s) => s.seatStatus === 'AVAILABLE').length
          : 0;

      return {
        id: f._id ? f._id.toString() : f.id,
        flightNumber: f.flightNumber,
        aircraftType: f.aircraftType || 'Boeing 737',
        sourceAirport: f.sourceAirport,
        destinationAirport: f.destinationAirport,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        baseFare: f.baseFare,
        taxes: f.taxes || 350,
        businessMultiplier: f.businessMultiplier || 1.5,
        availableSeatsCount: availableSeats,
      };
    });

    return res.json({
      success: true,
      count: flights.length,
      flights,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Flight By ID
 * GET /api/flights/:id
 */
const getFlightById = async (req, res, next) => {
  try {
    let flight = null;

    if (mongoose.connection.readyState === 1) {
      flight = await Flight.findById(req.params.id);
    } else {
      flight = memoryFlights.find(
        (f) => (f._id && f._id.toString() === req.params.id) || f.id === req.params.id
      );
    }

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found',
      });
    }

    return res.json({
      success: true,
      flight: {
        id: flight._id ? flight._id.toString() : flight.id,
        flightNumber: flight.flightNumber,
        aircraftType: flight.aircraftType || 'Boeing 737',
        sourceAirport: flight.sourceAirport,
        destinationAirport: flight.destinationAirport,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        baseFare: flight.baseFare,
        taxes: flight.taxes || 350,
        businessMultiplier: flight.businessMultiplier || 1.5,
        seats: flight.seats || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Flight (Admin Only)
 * POST /api/flights
 */
const createFlight = async (req, res, next) => {
  try {
    const {
      flightNumber,
      aircraftType,
      sourceAirport,
      destinationAirport,
      departureTime,
      arrivalTime,
      baseFare,
      taxes,
      businessMultiplier,
      businessRows = 2,
      businessCols = 2,
      economyRows = 8,
      economyCols = 6,
    } = req.body;

    if (!flightNumber || !sourceAirport || !destinationAirport || !departureTime || !arrivalTime || !baseFare) {
      return res.status(400).json({
        success: false,
        message: 'All required flight fields must be provided',
      });
    }

    const totalSeats =
      (parseInt(businessRows, 10) || 0) * (parseInt(businessCols, 10) || 0) +
      (parseInt(economyRows, 10) || 0) * (parseInt(economyCols, 10) || 0);

    let savedId = null;

    if (mongoose.connection.readyState === 1) {
      const newFlight = new Flight({
        flightNumber: flightNumber.trim().toUpperCase(),
        aircraftType: aircraftType || 'Boeing 737',
        sourceAirport: sourceAirport.trim().toUpperCase(),
        destinationAirport: destinationAirport.trim().toUpperCase(),
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        baseFare: Number(baseFare),
        taxes: Number(taxes) || 350,
        businessMultiplier: Number(businessMultiplier) || 1.5,
      });

      await newFlight.save();
      savedId = newFlight._id.toString();
    } else {
      savedId = '65d8f4c2b1c4a012' + Math.floor(10000000 + Math.random() * 90000000);
      const newFlight = {
        _id: savedId,
        id: savedId,
        flightNumber: flightNumber.trim().toUpperCase(),
        aircraftType: aircraftType || 'Boeing 737',
        sourceAirport: sourceAirport.trim().toUpperCase(),
        destinationAirport: destinationAirport.trim().toUpperCase(),
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        baseFare: Number(baseFare),
        taxes: Number(taxes) || 350,
        businessMultiplier: Number(businessMultiplier) || 1.5,
        availableSeatsCount: totalSeats,
        seats: [],
      };
      memoryFlights.unshift(newFlight);
    }

    return res.status(201).json({
      success: true,
      message: `Flight ${flightNumber.trim().toUpperCase()} created with ${totalSeats} total seats`,
      flightId: savedId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Flight (Admin Only)
 * DELETE /api/flights/:id
 */
const deleteFlight = async (req, res, next) => {
  try {
    let deleted = false;
    let flightNumber = '';

    if (mongoose.connection.readyState === 1) {
      const flight = await Flight.findByIdAndDelete(req.params.id);
      if (flight) {
        deleted = true;
        flightNumber = flight.flightNumber;
      }
    } else {
      const idx = memoryFlights.findIndex(
        (f) => (f._id && f._id.toString() === req.params.id) || f.id === req.params.id
      );
      if (idx !== -1) {
        flightNumber = memoryFlights[idx].flightNumber;
        memoryFlights.splice(idx, 1);
        deleted = true;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found',
      });
    }

    return res.json({
      success: true,
      message: `Flight ${flightNumber || req.params.id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFlights,
  getFlightById,
  createFlight,
  deleteFlight,
};
