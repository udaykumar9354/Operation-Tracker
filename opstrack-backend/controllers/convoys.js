const Convoy = require('../models/Convoy');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

// Create a new convoy
exports.createConvoy = async (req, res) => {
  try {
    const { name, commander, status, vehicles, route } = req.body;

    const commanderUser = await User.findById(commander);
    if (!commanderUser) return res.status(404).json({ error: 'Commander not found' });
    if (commanderUser.role !== 'commander') return res.status(400).json({ error: 'User is not a commander' });

    const convoy = new Convoy({
      name,
      commander: commanderUser._id,
      vehicles: vehicles || [],
      status: status || 'active',
      route: route || []
    });

    const saved = await convoy.save();
    await User.findByIdAndUpdate(commanderUser._id, { convoy: saved._id });

    const populated = await Convoy.findById(saved._id)
      .populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');

    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      return res.status(400).json({ error: 'Convoy name already exists' });
    }
    res.status(400).json({ error: err.message });
  }
};

// Get all convoys
exports.getAllConvoys = async (req, res) => {
  try {
    const convoys = await Convoy.find()
      .populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');
    res.json(convoys.length > 0 ? convoys : { message: 'No convoys found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get convoy by ID
exports.getConvoyById = async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id)
      .populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');
    if (!convoy) return res.status(404).json({ message: 'Convoy not found' });

    if (req.user.role === 'commander' && convoy.commander._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(convoy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get convoy for commander
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

    const oldConvoy = await Convoy.findById(req.params.id);
    if (!oldConvoy) return res.status(404).json({ error: 'Convoy not found' });

    const oldCommanderId = oldConvoy.commander;
    let newCommanderId = oldCommanderId;

    if (commander && commander !== oldCommanderId.toString()) {
      const newCommander = await User.findById(commander);
      if (!newCommander || newCommander.role !== 'commander') {
        return res.status(400).json({ error: 'Invalid new commander' });
      }
      updateData.commander = commander;
      newCommanderId = commander;
    }

    const updated = await Convoy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');

    if (oldCommanderId && oldCommanderId.toString() !== newCommanderId.toString()) {
      await User.findByIdAndUpdate(oldCommanderId, { convoy: null });
      await User.findByIdAndUpdate(newCommanderId, { convoy: req.params.id });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Patch convoy
exports.patchConvoy = async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) return res.status(404).json({ error: 'Convoy not found' });

    const { commander, ...updateData } = req.body;

    if (commander && commander !== convoy.commander.toString()) {
      const newCommander = await User.findById(commander);
      if (!newCommander || newCommander.role !== 'commander') {
        return res.status(400).json({ error: 'Invalid commander' });
      }

      await User.findByIdAndUpdate(convoy.commander, { $unset: { convoy: "" } });
      await User.findByIdAndUpdate(commander, { convoy: convoy._id });
      updateData.commander = commander;
    }

    const updated = await Convoy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('commander', 'name rank')
      .populate('vehicles', 'vehicleId type status');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteConvoy = async (req, res) => {
  try {
    // Populate commander to get the name
    const convoy = await Convoy.findById(req.params.id).populate('commander', 'name rank');
    if (!convoy) return res.status(404).json({ error: 'Convoy not found' });

    // Only allow deletion if status is 'completed'
    if (convoy.status !== 'completed') {
      return res.status(400).json({ error: 'Convoy can be deleted only if status is completed' });
    }

    // Check if convoy has assigned vehicles
    const vehicleCount = await Vehicle.countDocuments({ convoy: req.params.id });
    if (vehicleCount > 0) {
      // Free vehicles from this convoy
      await Vehicle.updateMany({ convoy: req.params.id }, { $unset: { convoy: "" } });
    }

    // Delete the convoy
    await Convoy.findByIdAndDelete(req.params.id);

    // Remove convoy reference from users assigned to this convoy
    await User.updateMany(
      { convoy: req.params.id },
      { $unset: { convoy: "" } }
    );

    res.json({
      message: `Convoy deleted, vehicles freed, and user convoy references cleared`,
      commanderName: convoy.commander ? convoy.commander.name : null,
      convoy
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Delete all convoys
exports.deleteAllConvoys = async (req, res) => {
  try {
    // Free all vehicles assigned to any convoy
    await Vehicle.updateMany({ convoy: { $exists: true, $ne: null } }, { $unset: { convoy: "" } });

    // Clear convoy field from all commanders
    await User.updateMany({ role: 'commander' }, { $unset: { convoy: "" } });

    // Delete all convoys
    const result = await Convoy.deleteMany();
    res.json({ message: `${result.deletedCount} convoys deleted and vehicles freed` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
