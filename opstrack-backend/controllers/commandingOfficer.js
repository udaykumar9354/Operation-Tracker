const CommandingOfficer = require('../models/CommandingOfficer');
const Convoy = require('../models/Convoy');
const User = require('../models/User');

// Create a new commanding officer
exports.createCommandingOfficer = async (req, res) => {
    try {
        const commandingOfficer = new CommandingOfficer(req.body);
        const saved = await commandingOfficer.save();
        //to check if the user exists
        const userExists = await User.findById(req.body.user);
        if (!userExists) {
            return res.status(400).json({ error: 'User does not exist' });
        }
        //to check if the convoy exists
        const convoyExists = await Convoy.findById(req.body.convoy);
        if (!convoyExists) {
            return res.status(400).json({ error: 'Convoy does not exist' });
        }
        //to check if the user is already a commanding officer
        const userIsCommandingOfficer = await CommandingOfficer.findOne({ user: req.body.user });
        if (userIsCommandingOfficer) {
            return res.status(400).json({ error: 'User is already a commanding officer' });
        }
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all commanding officers and their convoys
exports.getAllCommandingOfficers = async (req, res) => {
    try {
        const commandingOfficers = await CommandingOfficer.find().populate('convoy');
        if (commandingOfficers.length === 0) {
            return res.status(200).json({ message: 'No commanding officers found' });
        }
        res.json(commandingOfficers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a commanding officer by id
exports.getCommandingOfficerById = async (req, res) => {
    try {
        const commandingOfficer = await CommandingOfficer.findById(req.params.id).populate('convoy');
        if (!commandingOfficer) return res.status(404).json({ message: 'Commanding officer not found' });
        res.json(commandingOfficer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Patch a commanding officer
exports.patchCommandingOfficer = async (req, res) => {
    try {
        req.body.lastUpdated = new Date();
        const updated = await CommandingOfficer.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!updated) return res.status(404).json({ error: 'Commanding officer not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a commanding officer
exports.deleteCommandingOfficer = async (req, res) => {
    try {
        const deleted = await CommandingOfficer.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Commanding officer not found' });
        res.json({ message: 'Commanding officer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete all commanding officers   
exports.deleteAllCommandingOfficers = async (req, res) => {
    try {
        await CommandingOfficer.deleteMany({});
        res.status(200).json({ message: 'All commanding officers deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};