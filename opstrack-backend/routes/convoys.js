// routes/convoys.js
const express = require('express');
const router = express.Router();
const Convoy = require('../models/convoy');

// Create a new convoy
router.post('/', async (req, res) => {
    try {
        const convoy = new Convoy(req.body);
        const saved = await convoy.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all convoys
router.get('/', async (req, res) => {
    try {
        const convoys = await Convoy.find();
        res.json(convoys);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
