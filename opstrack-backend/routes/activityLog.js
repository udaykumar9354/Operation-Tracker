const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLog');
const { verifyToken, allowRoles } = require('../middleware/auth');

// Create a new activity log (admin/logistics only, but could be system-internal)
router.post('/create', verifyToken, allowRoles('admin', 'logistics'), activityLogController.createLog);

// Get logs for a given date (admin/logistics only)
router.get('/', verifyToken, allowRoles('admin', 'logistics'), activityLogController.getLogsForDate);

// Get recent logs (admin/logistics only)
router.get('/recent', verifyToken, allowRoles('admin', 'logistics'), activityLogController.getRecentLogs);

module.exports = router; 