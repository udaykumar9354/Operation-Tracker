const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const Convoy = require('../models/Convoy');

// sync vehicle status and convoy assignment based on maintenance condition
async function handleVehicleMaintenanceSync(vehicleId) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return;

  const hasLogs = vehicle.maintenanceLogs?.length > 0;
  const shouldBeInMaintenance = vehicle.status === 'damaged' || hasLogs;

  if (shouldBeInMaintenance) {
    if (vehicle.convoy) {
      await Convoy.findByIdAndUpdate(vehicle.convoy, { $pull: { vehicles: vehicle._id } });
      vehicle.convoy = null;
    }
    if (vehicle.status !== 'maintenance') {
      vehicle.status = 'maintenance';
    }
    await vehicle.save();
  }
}

// Create a new maintenance log
exports.createMaintenanceLog = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) {
      return res.status(400).json({ error: 'Vehicle does not exist' });
    }
    // if already in maintenance, return error
    if (vehicle.status === 'maintenance') {
      return res.status(400).json({ error: 'Vehicle is already in maintenance' });
    }
    
    const maintenanceLog = new MaintenanceLog(req.body);
    const saved = await maintenanceLog.save();

    // Add maintenanceLog id to vehicle.maintenanceLogs array
    vehicle.maintenanceLogs.push(saved._id);
    await vehicle.save();

    // Auto sync status/convoy
    await handleVehicleMaintenanceSync(vehicle._id);

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
    const log = await MaintenanceLog.findById(req.params.id)
      .populate('vehicle', 'vehicleId type convoy')
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

// count active maintenance logs
exports.countActiveMaintenanceLogs = async (req, res) => {
  try {
    const count = await MaintenanceLog.countDocuments({ status: 'active' });
    res.json({ count });
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

    // Sync vehicle status/convoy after update
    await handleVehicleMaintenanceSync(updated.vehicle);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a maintenance log
exports.deleteMaintenanceLog = async (req, res) => {
  try {
    const maintenanceLog = await MaintenanceLog.findById(req.params.id);
    if (!maintenanceLog) return res.status(404).json({ error: 'Maintenance log not found' });

    // Remove maintenanceLog id from vehicle's maintenanceLogs array
    await Vehicle.findByIdAndUpdate(maintenanceLog.vehicle, { 
      $pull: { maintenanceLogs: maintenanceLog._id }
    });

    const deleted = await MaintenanceLog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Maintenance log not found' });

    res.json({ message: 'Maintenance log deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
