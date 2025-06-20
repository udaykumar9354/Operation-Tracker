const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
    res.json({ message: 'Pong from OpsTrack API' });
});

module.exports = router;
