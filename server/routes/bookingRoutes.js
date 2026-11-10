const router = require('express').Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking
} = require('../controllers/bookingController');
const auth = require('../middleware/auth');

// All booking endpoints need a logged-in user (Bearer JWT).
// Note: '/user' must come before '/:id', otherwise Express would treat "user" as an id.
router.post('/',           auth, createBooking);   // POST /api/bookings
router.get('/user',        auth, getUserBookings); // GET  /api/bookings/user
router.get('/:id',         auth, getBookingById);  // GET  /api/bookings/:id
router.post('/:id/cancel', auth, cancelBooking);   // POST /api/bookings/:id/cancel

module.exports = router;
