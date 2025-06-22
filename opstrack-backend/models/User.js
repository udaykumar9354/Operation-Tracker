const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // hash passwords securely
  role: {
    type: String,
    enum: ['admin', 'commander', 'logistics'],
    required: true
  },
  // Only for commanders, which convoy they head
  convoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Convoy'
  }
});

module.exports = mongoose.model('User', userSchema);
