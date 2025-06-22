const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  serviceProvider: { type: String },
  cost: { type: Number, default: 0 },
  nextScheduledMaintenance: { type: Date }
});

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
