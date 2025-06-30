const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { verifyToken, allowRoles } = require('../middleware/auth');


// router.post('/', userController.createUser); //(if i forget password)
router.post('/create', verifyToken, allowRoles('admin'), userController.createUser);
router.post('/login', userController.loginUser);
router.get('/all-users', verifyToken, allowRoles('admin'), userController.getAllUsers);
router.get('/username/:username', verifyToken, allowRoles('admin'), userController.getUserByUsername);
router.get('/:id', verifyToken, allowRoles('admin'), userController.getUserById);
router.put('/change-password/:id?', verifyToken, userController.changePassword);
router.patch('/:id', verifyToken, allowRoles('admin'), userController.patchUser);
router.delete('/:id', verifyToken, allowRoles('admin'), userController.deleteUser);

module.exports = router;
