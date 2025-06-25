const Vehicle = require('../models/Vehicle');
const Convoy = require('../models/Convoy');
const User = require('../models/User');

// Create a new vehicle
exports.createVehicle = async (req, res) => {
    try {
        // check if the user is an admin or logistics
        if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const { convoy, ...data } = req.body;
        // check if the convoy exists
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
        // check if the user is an admin or logistics
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
        // check if the user is an admin or logistics
        if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const { vehicleId, convoyId } = req.body;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

        const convoy = await Convoy.findById(convoyId);
        if (!convoy) return res.status(404).json({ error: 'Convoy not found' });

        // remove the vehicle from the previous convoy
        if (vehicle.convoy) {
            await Convoy.findByIdAndUpdate(
                vehicle.convoy,
                { $pull: { vehicles: vehicleId } }
            );
        }

        // Update vehicle
        vehicle.convoy = convoyId;
        await vehicle.save();

        // Update convoy
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
        // check if the user is an admin or logistics
        if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const vehicle = await Vehicle.findById(req.params.id).populate('convoy');
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        res.json(vehicle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all vehicles in a convoy
exports.getVehiclesByConvoy = async (req, res) => {
    try {
        // check if the user is an admin or logistics
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
        // check if the user is an admin or logistics
        if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        req.body.lastUpdated = new Date();
        const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Patch vehicle (partial update - PATCH)
exports.patchVehicle = async (req, res) => {
    try {
        // check if the user is an admin or logistics
        if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        req.body.lastUpdated = new Date();
        const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete vehicle by ID
exports.deleteVehicleById = async (req, res) => {
    try {
        // check if the user is an admin or logistics
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
        // check if the user is an admin or logistics
        if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        await Vehicle.deleteMany({});
        if (vehicles.length === 0) {
            return res.status(200).json({ message: 'No vehicles found' });
        }
        res.status(200).json({ message: 'All vehicles deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

