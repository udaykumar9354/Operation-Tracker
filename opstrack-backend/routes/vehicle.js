const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle');
const { verifyToken, allowRoles } = require('../middleware/auth');

// admin and logistics can create a vehicle
router.post('/', verifyToken, allowRoles('admin', 'logistics'), vehicleController.createVehicle);

// admin and logistics can get all vehicles, commander can only see their own vehicles
router.get('/all', verifyToken, allowRoles('admin', 'logistics'), vehicleController.getAllVehicles);
router.get('/convoy/:convoyId', verifyToken, allowRoles('commander', 'admin', 'logistics'), vehicleController.getVehiclesByConvoy);
router.get('/:id', verifyToken, allowRoles('commander', 'admin', 'logistics'), vehicleController.getVehicleById);

// admin and logistics can update all vehicles
router.put('/:id', verifyToken, allowRoles('admin', 'logistics'), vehicleController.updateVehicle);

// admin and logistics can patch all vehicles
router.patch('/:id', verifyToken, allowRoles('admin', 'logistics'), vehicleController.patchVehicle);

// admin and logistics can delete all vehicles
router.delete('/all', verifyToken, allowRoles('admin', 'logistics'), vehicleController.deleteAllVehicles);

// admin and logistics can delete a vehicle
router.delete('/:id', verifyToken, allowRoles('admin', 'logistics'), vehicleController.deleteVehicleById);

// admin and logistics can assign a vehicle to a convoy
router.post('/assign', verifyToken, allowRoles('admin', 'logistics'), vehicleController.assignVehicleToConvoy);


module.exports = router;
