const User = require('../models/User');

/**
 * GET /api/wallet
 * Protected — retrieves current wallet balance and full transaction history
 */
exports.getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance walletTransactions');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      walletBalance: user.walletBalance,
      walletTransactions: user.walletTransactions || []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/wallet/topup
 * Protected — atomically adds funds to wallet using MongoDB $inc
 */
exports.topUp = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid top-up amount greater than 0'
      });
    }

    // Atomic update with MongoDB $inc and $push
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { walletBalance: numericAmount },
        $push: {
          walletTransactions: {
            type: 'TOPUP',
            amount: numericAmount,
            description: 'Wallet top-up',
            date: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const formattedAmount = numericAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return res.status(200).json({
      success: true,
      newBalance: updatedUser.walletBalance,
      message: `₹${formattedAmount} added to wallet successfully`
    });
  } catch (err) {
    next(err);
  }
};
