const Vehicle = require('../models/Vehicle');
const Convoy = require('../models/Convoy');
const CommandingOfficer = require('../models/CommandingOfficer');

// Create a new vehicle
exports.createVehicle = async (req, res) => {
    try {
        // Check if the convoy exists
        const convoyExists = await Convoy.findById(req.body.convoy);
        if (!convoyExists) {
            return res.status(400).json({ error: 'Convoy does not exist' });
        }

        // Create the vehicle if convoy exists
        const vehicle = new Vehicle(req.body);
        const saved = await vehicle.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all vehicles
exports.getAllVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find().populate('convoy');
        if (vehicles.length === 0) {
            return res.status(200).json({ message: 'No vehicles found' });
        }
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a vehicle by id
exports.getVehicleById = async (req, res) => {
    try {
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
        const vehicles = await Vehicle.find({ convoy: req.params.convoyId }).populate('convoy');
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update vehicle (full update - PUT)
exports.updateVehicle = async (req, res) => {
    try {
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
        await Vehicle.deleteMany({});
        if (vehicles.length === 0) {
            return res.status(200).json({ message: 'No vehicles found' });
        }
        res.status(200).json({ message: 'All vehicles deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};