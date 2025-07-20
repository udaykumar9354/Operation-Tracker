const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// Create a new activity log
exports.createLog = async (req, res) => {
    try {
        const { type, message, entityType, entityId, meta } = req.body;
        const log = new ActivityLog({
            type,
            message,
            entityType,
            entityId: entityId ? mongoose.Types.ObjectId(entityId) : undefined,
            meta,
        });
        const saved = await log.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all logs for a given date (YYYY-MM-DD, default today)
exports.getLogsForDate = async (req, res) => {
    try {
        const dateStr = req.query.date;
        let start, end;
        if (dateStr) {
            start = new Date(dateStr);
            end = new Date(dateStr);
            end.setDate(end.getDate() + 1);
        } else {
            // Default: today
            start = new Date();
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(end.getDate() + 1);
        }
        const logs = await ActivityLog.find({
            timestamp: { $gte: start, $lt: end }
        }).sort({ timestamp: 1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get the most recent N logs (optional, for flexibility)
exports.getRecentLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(limit);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 