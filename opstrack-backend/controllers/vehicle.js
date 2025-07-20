const Vehicle = require('../models/Vehicle');
const Convoy = require('../models/Convoy');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

async function syncConvoyVehicleAssignment(vehicleId, oldConvoyId, newConvoyId) {
  if (oldConvoyId && (!newConvoyId || oldConvoyId.toString() !== newConvoyId.toString())) {
    await Convoy.findByIdAndUpdate(oldConvoyId, { $pull: { vehicles: vehicleId } });
  }
  if (newConvoyId && (!oldConvoyId || oldConvoyId.toString() !== newConvoyId.toString())) {
    await Convoy.findByIdAndUpdate(newConvoyId, { $addToSet: { vehicles: vehicleId } });
  }
}

// Create a new vehicle, default coordinates in delhi
exports.createVehicle = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { convoy, ...data } = req.body;

    if (convoy) {
      const convoyExists = await Convoy.exists({ _id: convoy });
      if (!convoyExists) {
        return res.status(400).json({ error: 'Invalid convoy ID' });
      }
    }

    // Default vehicle status to 'operational' if not provided
    if (!data.status) data.status = 'operational';

    // Default coordinates to Delhi if not provided
    if (!data.currentLocation ||
      typeof data.currentLocation.latitude !== 'number' ||
      typeof data.currentLocation.longitude !== 'number') {
      data.currentLocation = { latitude: 28.6139, longitude: 77.2090 };
    }

    const vehicle = new Vehicle({ ...data, convoy });
    const saved = await vehicle.save();

    if (convoy) {
      await Convoy.findByIdAndUpdate(
        convoy,
        { $addToSet: { vehicles: saved._id } }
      );
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const vehicles = await Vehicle.find()
      .populate('convoy', 'name status')
      .populate('maintenanceLogs');
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign vehicle to convoy
exports.assignVehicleToConvoy = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { vehicleId, convoyId } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const convoy = await Convoy.findById(convoyId);
    if (!convoy) return res.status(404).json({ error: 'Convoy not found' });

    if (vehicle.convoy) {
      await Convoy.findByIdAndUpdate(
        vehicle.convoy,
        { $pull: { vehicles: vehicleId } }
      );
    }

    if (vehicle.status !== 'operational') {
      return res.status(400).json({ message: 'Vehicle is not operational or under maintenance' });
    }

    // Set vehicle location based on convoy status and route
    if (Array.isArray(convoy.route) && convoy.route.length >= 2) {
      const start = convoy.route[0];
      const end = convoy.route[convoy.route.length - 1];
      if (convoy.status === 'active') {
        // Midpoint
        vehicle.currentLocation = {
          latitude: (start.latitude + end.latitude) / 2,
          longitude: (start.longitude + end.longitude) / 2
        };
      } else if (convoy.status === 'completed') {
        // End point
        vehicle.currentLocation = {
          latitude: end.latitude,
          longitude: end.longitude
        };
      }
      // For other statuses, do not update location
    }

    vehicle.convoy = convoyId;
    await vehicle.save();

    await Convoy.findByIdAndUpdate(
      convoyId,
      { $addToSet: { vehicles: vehicleId } }
    );

    // Log activity
    await ActivityLog.create({
      type: 'vehicle_assigned',
      message: `Vehicle ${vehicle.vehicleId} assigned to convoy ${convoy.name}`,
      entityType: 'Vehicle',
      entityId: vehicle._id,
      meta: { vehicleId: vehicle.vehicleId, convoyId: convoy._id, convoyName: convoy.name }
    });

    res.json({
      message: 'Vehicle assigned to convoy',
      vehicle: vehicle.vehicleId,
      convoy: convoy.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a vehicle by id
exports.getVehicleById = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const vehicle = await Vehicle.findById(req.params.id).populate('convoy').populate('maintenanceLogs');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all vehicles in a convoy
exports.getVehiclesByConvoy = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const vehicles = await Vehicle.find({ convoy: req.params.convoyId }).populate('convoy');
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update vehicle (full update - PUT)
exports.updateVehicle = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const oldVehicle = await Vehicle.findById(req.params.id);
    if (!oldVehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const oldConvoyId = oldVehicle.convoy ? oldVehicle.convoy.toString() : null;
    const newConvoyId = req.body.convoy || null;

    req.body.lastUpdated = new Date();

    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await syncConvoyVehicleAssignment(updated._id, oldConvoyId, newConvoyId);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Patch vehicle (partial update - PATCH), changing convoy
exports.patchVehicle = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const oldVehicle = await Vehicle.findById(req.params.id);
    if (!oldVehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const oldConvoyId = oldVehicle.convoy ? oldVehicle.convoy.toString() : null;
    const newConvoyId = req.body.hasOwnProperty('convoy') ? req.body.convoy : oldConvoyId;

    req.body.lastUpdated = new Date();

    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    await syncConvoyVehicleAssignment(updated._id, oldConvoyId, newConvoyId);

    // Log unassignment if convoy is being removed (oldConvoyId existed, newConvoyId is null)
    if (oldConvoyId && (newConvoyId === null || newConvoyId === undefined || newConvoyId === 'null' || newConvoyId === '')) {
      const oldConvoy = await Convoy.findById(oldConvoyId);
      await ActivityLog.create({
        type: 'vehicle_unassigned',
        message: `Vehicle ${updated.vehicleId} unassigned from convoy ${oldConvoy ? oldConvoy.name : oldConvoyId}`,
        entityType: 'Vehicle',
        entityId: updated._id,
        meta: { vehicleId: updated.vehicleId, convoyId: oldConvoyId, convoyName: oldConvoy ? oldConvoy.name : undefined }
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete vehicle by ID
exports.deleteVehicleById = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted successfully', deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete all vehicles
exports.deleteAllVehicles = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    await Vehicle.deleteMany({});
    res.status(200).json({ message: 'All vehicles deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
