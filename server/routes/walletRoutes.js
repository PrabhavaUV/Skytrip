const router = require('express').Router();
const { getWallet, topUp } = require('../controllers/walletController');
const auth = require('../middleware/auth');

// All wallet operations require authentication
router.get('/', auth, getWallet);
router.post('/topup', auth, topUp);

module.exports = router;
