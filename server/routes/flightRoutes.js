const router = require('express').Router();
const {
  searchFlights,
  getFlightById,
  createFlight,
  deleteFlight,
} = require('../controllers/flightController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Public routes
router.get('/', searchFlights);
router.get('/:id', getFlightById);

// Protected Admin routes
router.post('/', auth, admin, createFlight);
router.delete('/:id', auth, admin, deleteFlight);

module.exports = router;

