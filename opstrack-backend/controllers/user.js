const User = require('../models/User');
const Convoy = require('../models/Convoy');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create a new user- only admin can create users
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role, convoy } = req.body;

    const allowedRoles = ['admin', 'commander', 'logistics'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    if (role === 'commander') {
      const convoyDoc = await Convoy.findById(convoy);
      if (!convoyDoc) {
        return res.status(400).json({ error: 'Invalid convoy ID for commander' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      passwordHash,
      role,
      convoy: role === 'commander' ? convoy : null
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
        const users = await User.find();
        if (users.length === 0) {
            return res.status(200).json({ message: 'No users found' });
        }
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

