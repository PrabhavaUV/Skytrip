const express = require('express');
const router = express.Router();
const { holdSeats, releaseSeats } = require('../controllers/seatController');
const auth = require('../middleware/auth');

// Protected seat endpoints (require Bearer JWT)
router.post('/hold', auth, holdSeats);
router.post('/release', auth, releaseSeats);

module.exports = router;
