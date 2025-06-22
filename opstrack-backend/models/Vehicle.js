const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // e.g. Truck, Jeep, Tank
  capacity: { type: Number, default: 0 }, // cargo/passenger capacity
  status: {
    type: String,
    enum: ['available', 'in_use', 'under_maintenance'],
    default: 'available'
  },
  maintenanceLogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceLog'
    }
  ]
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
