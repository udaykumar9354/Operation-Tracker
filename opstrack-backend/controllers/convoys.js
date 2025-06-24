const Convoy = require('../models/Convoy');
const CommandingOfficer = require('../models/CommandingOfficer');

// Create a new convoy
exports.createConvoy = async (req, res) => {
  try {
    const convoy = new Convoy(req.body);
    const saved = await convoy.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all convoys (admin and logistics can see all convoys)
exports.getAllConvoys = async (req, res) => {
  try {
    const convoys = await Convoy.find();
    if (convoys.length === 0) {
      return res.status(200).json({ message: 'No convoys found' });
    }
    res.json(convoys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a convoy by id (commander can only see their own convoy but admin and logistics can see all convoys)
exports.getConvoyById = async (req, res) => {
  try {
    // if commander, check if they are the commander of the convoy
    if (req.user.role === 'commander') {
      const convoy = await Convoy.findById(req.params.id);
      if (!convoy) return res.status(404).json({ message: 'Convoy not found' });
      if (convoy.commander.toString() !== req.user.id) return res.status(403).json({ message: 'You are not authorized to access this convoy' });
    }
    const convoy = await Convoy.findById(req.params.id);  
    if (!convoy) return res.status(404).json({ message: 'Convoy not found' });
    res.json(convoy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update convoy (full update - PUT) (admin and logistics can update all convoys)
exports.updateConvoy = async (req, res) => {
    try {
      // check if the convoy exists
      const convoy = await Convoy.findById(req.params.id);
      if (!convoy) return res.status(404).json({ error: 'Convoy not found' });
      const updated = await Convoy.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      if (!updated) return res.status(404).json({ error: 'Convoy not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  // Patch convoy (partial update - PATCH) (admin and logistics can update all convoys)
  exports.patchConvoy = async (req, res) => {
    try {
      // check if the convoy exists
      const convoy = await Convoy.findById(req.params.id);
      if (!convoy) return res.status(404).json({ error: 'Convoy not found' });
      const updated = await Convoy.findByIdAndUpdate(req.params.id, req.body, {
        new: true
      });
      if (!updated) return res.status(404).json({ error: 'Convoy not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  // Delete convoy (admin and logistics can delete all convoys)
  exports.deleteConvoy = async (req, res) => {
    try {
      // check if the convoy exists
      const convoy = await Convoy.findById(req.params.id);
      if (!convoy) return res.status(404).json({ error: 'Convoy not found' });
      // check if the convoy has any vehicles
      const vehicles = await Vehicle.find({ convoy: req.params.id });
      if (vehicles.length > 0) return res.status(400).json({ error: 'Convoy has vehicles and cannot be deleted' });
      const deleted = await Convoy.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Convoy not found' });
      res.json({ message: 'Convoy deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Delete all convoys (admin and logistics can delete all convoys)
exports.deleteAllConvoys = async (req, res) => {
    try {
      // check if there are any convoys
      const convoys = await Convoy.find();
      if (convoys.length === 0) {
        return res.status(200).json({ message: 'No convoys found' });
      }
      await Convoy.deleteMany({});
      res.status(200).json({ message: 'All convoys deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  