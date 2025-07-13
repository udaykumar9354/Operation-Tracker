const express = require('express');
const router = express.Router();
const convoyController = require('../controllers/convoys');
const { verifyToken, allowRoles } = require('../middleware/auth');

// admin can create a convoy
router.post('/create', verifyToken, allowRoles('admin'), convoyController.createConvoy);

// admin and logistics can get all convoys
router.get('/all-convoys', verifyToken, allowRoles('admin', 'logistics'), convoyController.getAllConvoys);

// get all active convoys (logistics, commander)
router.get('/active', verifyToken, allowRoles('admin', 'logistics', 'commander'), convoyController.getActiveConvoys);

// get vehicles of a convoy (admin, logistics, commander)
router.get('/:id/vehicles', verifyToken, allowRoles('admin', 'logistics', 'commander'), convoyController.getConvoyVehicles);

// commander-specific route 
router.get('/my-convoy', verifyToken, allowRoles('commander'), convoyController.getMyConvoy);

// get convoy by ID (admin, logistics, commander)
router.get('/:id', verifyToken, allowRoles('commander', 'admin', 'logistics'), convoyController.getConvoyById);

// admin and logistics can update all convoys
router.put('/:id', verifyToken, allowRoles('admin', 'logistics'), convoyController.updateConvoy);
router.patch('/:id', verifyToken, allowRoles('admin', 'logistics'), convoyController.patchConvoy);

// admin and logistics can delete all convoys or a convoy by id
router.delete('/all', verifyToken, allowRoles('admin', 'logistics'), convoyController.deleteAllConvoys);
router.delete('/:id', verifyToken, allowRoles('admin', 'logistics'), convoyController.deleteConvoy);

module.exports = router;
