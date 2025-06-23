const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle');

router.post('/', vehicleController.createVehicle);

router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicleById);

router.put('/:id', vehicleController.updateVehicle);

router.patch('/:id', vehicleController.patchVehicle);

router.delete('/all', vehicleController.deleteAllVehicles);
router.delete('/:id', vehicleController.deleteVehicleById);

module.exports = router;
