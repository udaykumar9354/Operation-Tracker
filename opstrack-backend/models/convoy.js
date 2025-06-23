const mongoose = require('mongoose');

const convoySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  commander: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['active', 'halted', 'under_threat', 'completed'],
    default: 'active'
  },

  route: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  ],

  vehicles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    }
  ],

  commander: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommandingOfficer',
    required: true
  },

  
  createdAt: {
    type: Date,
    default: Date.now
  }
});



module.exports = mongoose.model('Convoy', convoySchema);
