const Vehicle = require('../models/Vehicle');
const Convoy = require('../models/Convoy');
const User = require('../models/User');

async function syncConvoyVehicleAssignment(vehicleId, oldConvoyId, newConvoyId) {
  if (oldConvoyId && (!newConvoyId || oldConvoyId.toString() !== newConvoyId.toString())) {
    await Convoy.findByIdAndUpdate(oldConvoyId, { $pull: { vehicles: vehicleId } });
  }
  if (newConvoyId && (!oldConvoyId || oldConvoyId.toString() !== newConvoyId.toString())) {
    await Convoy.findByIdAndUpdate(newConvoyId, { $addToSet: { vehicles: vehicleId } });
  }
}

// Create a new vehicle
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
      .populate('convoy', 'name status');
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
      return res.status(400).json({ message: 'Vehicle is not operational' });
    }

    vehicle.convoy = convoyId;
    await vehicle.save();

    await Convoy.findByIdAndUpdate(
      convoyId,
      { $addToSet: { vehicles: vehicleId } }
    );

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

// Patch vehicle (partial update - PATCH)
exports.patchVehicle = async (req, res) => {
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
      new: true
    });

    await syncConvoyVehicleAssignment(updated._id, oldConvoyId, newConvoyId);

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
