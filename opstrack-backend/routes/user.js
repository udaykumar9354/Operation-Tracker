const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { verifyToken, allowRoles } = require('../middleware/auth');


// router.post('/', userController.createUser); //(if i forget password)
router.post('/', verifyToken, allowRoles('admin'), userController.createUser);
router.post('/login', userController.loginUser);
router.get('/', verifyToken, allowRoles('admin'), userController.getAllUsers);
router.get('/username/:username', verifyToken, allowRoles('admin'), userController.getUserByUsername);
router.get('/:id', verifyToken, allowRoles('admin'), userController.getUserById);
router.patch('/:id', verifyToken, allowRoles('admin'), userController.patchUser);
router.delete('/:id', verifyToken, allowRoles('admin'), userController.deleteUser);

module.exports = router;
