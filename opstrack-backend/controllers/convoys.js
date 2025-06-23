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

// Get all convoys
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

// Get a convoy by id
exports.getConvoyById = async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id);  
    if (!convoy) return res.status(404).json({ message: 'Convoy not found' });
    res.json(convoy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update convoy (full update - PUT)
exports.updateConvoy = async (req, res) => {
    try {
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
  
  // Patch convoy (partial update - PATCH)
  exports.patchConvoy = async (req, res) => {
    try {
      const updated = await Convoy.findByIdAndUpdate(req.params.id, req.body, {
        new: true
      });
      if (!updated) return res.status(404).json({ error: 'Convoy not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  // Delete convoy
  exports.deleteConvoy = async (req, res) => {
    try {
      const deleted = await Convoy.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Convoy not found' });
      res.json({ message: 'Convoy deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Delete all convoys
exports.deleteAllConvoys = async (req, res) => {
    try {
      await Convoy.deleteMany({});
      res.status(200).json({ message: 'All convoys deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  