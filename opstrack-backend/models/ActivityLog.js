const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    type: { type: String, required: true }, // e.g., 'convoy_completed', 'vehicle_assigned', etc.
    message: { type: String, required: true },
    entityType: { type: String }, // e.g., 'Convoy', 'Vehicle', etc.
    entityId: { type: mongoose.Schema.Types.ObjectId },
    timestamp: { type: Date, default: Date.now },
    meta: { type: Object }, // any extra info
});

module.exports = mongoose.model('ActivityLog', activityLogSchema); 