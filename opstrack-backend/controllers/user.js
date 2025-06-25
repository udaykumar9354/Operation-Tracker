const User = require('../models/User');
const Convoy = require('../models/Convoy');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create a new user- only admin can create users
exports.createUser = async (req, res) => {
  try {
    const { name, rank, username, email, password, role, convoy } = req.body;

    const allowedRoles = ['admin', 'commander', 'logistics'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Only check convoy if role is commander AND convoy is provided (not null/undefined)
    if (role === 'commander' && convoy) {
      const convoyDoc = await Convoy.findById(convoy);
      if (!convoyDoc) {
        return res.status(400).json({ error: 'Invalid convoy ID for commander' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      rank,
      username,
      email,
      passwordHash,
      role,
      // Assign convoy only if role is commander and convoy is provided, else null
      convoy: role === 'commander' && convoy ? convoy : null
    });

    const savedUser = await newUser.save();
    res.status(201).json({
      message: 'User created successfully. Share credentials securely.',
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        role: savedUser.role
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Login a user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      'secretKey123',
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // check if the user is an admin or logistics
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const users = await User.find({}, 'name rank username email role convoy');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a user by id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a user by username
exports.getUserByUsername = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Patch a user
exports.patchUser = async (req, res) => {
    try {
        req.body.lastUpdated = new Date();
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully', deleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

