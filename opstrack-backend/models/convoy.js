const mongoose = require('mongoose');

const convoySchema = new mongoose.Schema({
    name: { type: String, required: true },
    commander: { type: String, required: true },
    route: [
        {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        }
    ],
    vehicles: [{ type: String }], // vehicle IDs for now
    status: { type: String, default: 'active' }, // active, halted, under_threat
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Convoy', convoySchema);
