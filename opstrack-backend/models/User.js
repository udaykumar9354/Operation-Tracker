const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rank: {
    type: String,
    enum: ['Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel',
           'Brigadier', 'Lieutenant General', 'Major General', 'General'],
    required: true
  },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'commander', 'logistics'],
    required: true
  },
  convoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Convoy',
    default: null
  }
  
}, { timestamps: true });



module.exports = mongoose.model('User', userSchema);