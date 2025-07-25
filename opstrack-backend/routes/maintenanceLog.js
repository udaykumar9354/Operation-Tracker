const express = require('express');
const router = express.Router();
const maintenanceLogController = require('../controllers/maintenanceLog');
const { verifyToken, allowRoles } = require('../middleware/auth');

// admin and logistics can create a maintenance log
router.post('/create', verifyToken, allowRoles('admin', 'logistics'), maintenanceLogController.createMaintenanceLog);

// admin and logistics can get all maintenance logs
router.get('/all-logs', verifyToken, allowRoles('admin', 'logistics'), maintenanceLogController.getAllMaintenanceLogs);

// admin and logistics can get active maintenance logs
router.get('/active', verifyToken, allowRoles('admin', 'logistics'), maintenanceLogController.countActiveMaintenanceLogs);

// admin and logistics can get a maintenance log by id
router.get('/:id', verifyToken, allowRoles('admin', 'logistics'), maintenanceLogController.getMaintenanceLogById);

// admin and logistics can get a maintenance log by vehicle id
router.get('/vehicle/:vehicleId', verifyToken, allowRoles('admin', 'logistics'), maintenanceLogController.getMaintenanceLogByVehicleId);

// admin and logistics can patch a maintenance log
router.patch('/:id', verifyToken, allowRoles('admin', 'logistics'), maintenanceLogController.patchMaintenanceLog);

// admin and logistics can delete a maintenance log
router.delete('/:id', verifyToken, allowRoles('admin', 'logistics'), maintenanceLogController.deleteMaintenanceLog);

module.exports = router;