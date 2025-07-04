const mongoose = require('mongoose');

const convoySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'halted', 'under_threat', 'completed'],
    default: 'active'
  },
  route: [{
    _id: false,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }],
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  }],
  commander: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async function (v) {
        const user = await mongoose.model('User').findById(v);
        return user && user.role === 'commander';
      },
      message: 'User must be a commander'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Convoy', convoySchema);