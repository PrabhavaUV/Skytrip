const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['TOPUP', 'DEBIT', 'REFUND'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['CUSTOMER', 'ADMIN'],
    default: 'CUSTOMER'
  },
  walletBalance: {
    type: Number,
    default: 5000.00,
    min: [0, 'Wallet balance cannot be negative']
  },
  walletTransactions: [walletTransactionSchema]
}, {
  timestamps: true
});

// Pre-save hook: hash password with bcryptjs before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Helper instance method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
