const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true
  },

  type: {
    type: String,
    enum: ['truck', 'jeep', 'ambulance', 'fuel_tanker', 'armored'],
    required: true
  },

  fuelLevel: {
    type: Number,
    default: 100
  },

  status: {
    type: String,
    enum: ['operational', 'damaged', 'low_fuel', 'inactive'],
    default: 'operational'
  },

  supplies: {
    food: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    ammo: { type: Number, default: 0 }
  },

  currentLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },

  convoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Convoy',
    required: false
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  },

  maintenanceLogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceLog',
    required: false
  }]
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
