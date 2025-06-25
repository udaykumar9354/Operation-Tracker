const Convoy = require('../models/Convoy');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

// Create a new convoy
exports.createConvoy = async (req, res) => {
  try {
    const { name, commander, status, vehicles, route } = req.body;
    
    // Validate commander
    const commanderUser = await User.findById(commander);
    if (!commanderUser) return res.status(404).json({ error: 'Commander not found' });
    if (commanderUser.role !== 'commander') return res.status(400).json({ error: 'User is not a commander' });
    
    // Create convoy
    const convoy = new Convoy({ 
      name, 
      commander: commanderUser._id,
      vehicles: vehicles || [],
      status: status || 'active',
      route: route || []
    });
    
    const saved = await convoy.save();
    
    // Populate response for better UX
    const populated = await Convoy.findById(saved._id)
      .populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');
    
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      return res.status(400).json({ error: 'Convoy name already exists' });
    }
    res.status(400).json({ 
      error: err.message,
    });
  }
};

// Get all convoys
exports.getAllConvoys = async (req, res) => {
  try {
    const convoys = await Convoy.find()
      .populate('commander', 'name rank') // Fixed syntax
      .populate('vehicles', 'vehicleId type status'); // Fixed syntax
    
    res.json(convoys.length > 0 ? convoys : { message: 'No convoys found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get specific convoy
exports.getConvoyById = async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id)
      .populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');
    
    if (!convoy) return res.status(404).json({ message: 'Convoy not found' });
    
    // Commander authorization
    if (req.user.role === 'commander' && 
        convoy.commander._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    res.json(convoy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get commander's convoy
exports.getMyConvoy = async (req, res) => {
  try {
    const convoy = await Convoy.findOne({ commander: req.user.id })
      .populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');
    
    if (!convoy) return res.status(404).json({ message: 'No convoy assigned to you' });
    
    res.json(convoy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update convoy (PUT)
exports.updateConvoy = async (req, res) => {
  try {
    const { commander, ...updateData } = req.body;
    
    // Validate commander if included in update
    if (commander) {
      const commanderUser = await User.findById(commander);
      if (!commanderUser) return res.status(404).json({ error: 'Commander not found' });
      if (commanderUser.role !== 'commander') return res.status(400).json({ error: 'User is not a commander' });
      updateData.commander = commander;
    }
    
    const updated = await Convoy.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    )
      .populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');
    
    if (!updated) return res.status(404).json({ error: 'Convoy not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update convoy (PATCH)
exports.patchConvoy = async (req, res) => {
  try {
    const { commander, ...updateData } = req.body;
    
    // Validate commander if included in update
    if (commander) {
      const commanderUser = await User.findById(commander);
      if (!commanderUser) return res.status(404).json({ error: 'Commander not found' });
      if (commanderUser.role !== 'commander') return res.status(400).json({ error: 'User is not a commander' });
      updateData.commander = commander;
    }
    
    const updated = await Convoy.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    )
      .populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');
    
    if (!updated) return res.status(404).json({ error: 'Convoy not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete convoy
exports.deleteConvoy = async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) return res.status(404).json({ error: 'Convoy not found' });
    
    // Check for assigned vehicles
    const vehicleCount = await Vehicle.countDocuments({ convoy: req.params.id });
    if (vehicleCount > 0) {
      return res.status(400).json({ error: 'Convoy has assigned vehicles' });
    }
    
    await Convoy.findByIdAndDelete(req.params.id);
    res.json({ message: 'Convoy deleted' , convoy});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete all convoys
exports.deleteAllConvoys = async (req, res) => {
  try {
    // Check for any vehicles assigned to convoys
    const vehicleCount = await Vehicle.countDocuments({ convoy: { $exists: true, $ne: null } });
    if (vehicleCount > 0) {
      return res.status(400).json({ error: 'Some convoys have assigned vehicles' });
    }
    
    const result = await Convoy.deleteMany();
    res.json({ message: `${result.deletedCount} convoys deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};