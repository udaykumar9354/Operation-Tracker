const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const Convoy = require('../models/Convoy');

// Create a new maintenance log
exports.createMaintenanceLog = async (req, res) => {
    try {
        // Check if the vehicle exists
        const vehicleExists = await Vehicle.findById(req.body.vehicle);
        if (!vehicleExists) {
            return res.status(400).json({ error: 'Vehicle does not exist' });
        }

        // Create the log if vehicle exists
        const maintenanceLog = new MaintenanceLog(req.body);
        const saved = await maintenanceLog.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


// Get all maintenance logs
exports.getAllMaintenanceLogs = async (req, res) => {
    try {
      const logs = await MaintenanceLog.find()
        .populate('vehicle', 'vehicleId type convoy')
        .populate({
          path: 'vehicle',
          populate: { path: 'convoy', select: 'name' }
        });
      
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

exports.getMaintenanceLogById = async (req, res) => {
    try {
        const log = await MaintenanceLog.findById(req.params.id).populate('vehicle', 'vehicleId type convoy')
        .populate({
          path: 'vehicle',
          populate: { path: 'convoy', select: 'name' }
        });
        if (!log) return res.status(404).json({ message: 'Log not found' });
        res.json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get a maintenance log by vehicle id  
exports.getMaintenanceLogByVehicleId = async (req, res) => {
    try {
        const maintenanceLogs = await MaintenanceLog.find({ vehicle: req.params.vehicleId });
        if (!maintenanceLogs) return res.status(404).json({ error: 'Maintenance logs not found' });
        res.json(maintenanceLogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Patch a maintenance log
exports.patchMaintenanceLog = async (req, res) => {
    try {
        req.body.lastUpdated = new Date();
        const updated = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!updated) return res.status(404).json({ error: 'Maintenance log not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a maintenance log
exports.deleteMaintenanceLog = async (req, res) => {
    try {
        // check if the maintenance log exists
        const maintenanceLog = await MaintenanceLog.findById(req.params.id);
        if (!maintenanceLog) return res.status(404).json({ error: 'Maintenance log not found' });
        const deleted = await MaintenanceLog.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Maintenance log not found' });
        res.json({ message: 'Maintenance log deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

