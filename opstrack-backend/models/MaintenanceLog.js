const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  
  date: { 
    type: Date, 
    default: Date.now 
  },
  
  description: { 
    type: String,
    enum: [
      'Oil Change',
      'Tire Rotation',
      'Brake Inspection',
      'Engine Tune-up',
      'Transmission Service',
      'Battery Replacement',
      'Fluid Check',
      'Filter Replacement',
      'Other'
    ], 
    required: true 
  },
  
  serviceProvider: { 
    type: String
  },
  
  cost: { 
    type: Number, 
    default: 0 
  },
  
  nextScheduledMaintenance: { 
    type: Date 
  }
});

maintenanceLogSchema.index({ vehicle: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
