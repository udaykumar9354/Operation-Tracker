const User = require('../models/User');
const Convoy = require('../models/Convoy');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create a new user - only admin can create users
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

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user._id, role: user.role }, 'secretKey123', { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, user: { _id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const users = await User.find({}, 'name rank username email role convoy')
      .populate('convoy', 'name status');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('convoy', 'name status');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// returns user data including role for /users/me
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('convoy', 'name status');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id: user._id,
      name: user.name,
      rank: user.rank,
      username: user.username,
      email: user.email,
      role: user.role,
      convoy: user.convoy ? {
        _id: user.convoy._id,
        name: user.convoy.name,
        status: user.convoy.status
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate('convoy', 'name status');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.patchUser = async (req, res) => {
  try {
    req.body.lastUpdated = new Date();
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully', deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// changing password function, in url if its admin, id must be given, if no id, self
// password is changed

exports.changePassword = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    const requesterId = req.user.id;
    const targetUserId = req.params.id || requesterId;  // if no id param, use self
    const { currentPassword, newPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // If user is logistics or commander, they can only change their own password
    if (requesterRole !== 'admin' && targetUserId !== requesterId) {
      return res.status(403).json({ error: 'Unauthorized to change another user\'s password' });
    }

    // Fetch user to update
    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If not admin, verify currentPassword before allowing change
    if (requesterRole !== 'admin') {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.passwordHash = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
