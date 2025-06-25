const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, 'secretKey123');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

exports.allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: You do not have access' });
        }
        next();
    };
};

// Add convoy authorization for commanders
exports.authorizeConvoyAccess = async (req, res, next) => {
    if (req.user.role === 'commander') {
      const convoy = await Convoy.findOne({ commander: req.user.id });
      if (!convoy || convoy._id.toString() !== req.params.id) {
        return res.status(403).json({ message: 'Unauthorized convoy access' });
      }
    }
    next();
  };
