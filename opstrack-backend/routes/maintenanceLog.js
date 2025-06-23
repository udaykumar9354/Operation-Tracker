const express = require('express');
const router = express.Router();
const maintenanceLogController = require('../controllers/maintenanceLog');

router.post('/', maintenanceLogController.createMaintenanceLog);

router.get('/', maintenanceLogController.getAllMaintenanceLogs);
router.get('/:id', maintenanceLogController.getMaintenanceLogById);

router.get('/vehicle/:vehicleId', maintenanceLogController.getMaintenanceLogByVehicleId);
router.patch('/:id', maintenanceLogController.patchMaintenanceLog);

module.exports = router;