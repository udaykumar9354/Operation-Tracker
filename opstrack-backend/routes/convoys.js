const express = require('express');
const router = express.Router();
const convoyController = require('../controllers/convoys');
const { verifyToken, allowRoles } = require('../middleware/auth');

// admin and logistics can create a convoy
router.post('/', verifyToken, allowRoles('admin'), convoyController.createConvoy);

// admin and logistics can get all convoys
router.get('/', verifyToken, allowRoles('admin', 'logistics'), convoyController.getAllConvoys);
// commander can only see their own convoy 
router.get('/:id', verifyToken, allowRoles('commander', 'admin', 'logistics'), convoyController.getConvoyById)

// admin and logistics can update all convoys
router.put('/:id', verifyToken, allowRoles('admin', 'logistics'), convoyController.updateConvoy);

router.patch('/:id', verifyToken, allowRoles('admin', 'logistics'), convoyController.patchConvoy);

// admin and logistics can delete all convoys
router.delete('/all', verifyToken, allowRoles('admin', 'logistics'), convoyController.deleteAllConvoys);
router.delete('/:id', verifyToken, allowRoles('admin', 'logistics'), convoyController.deleteConvoy);


module.exports = router;
