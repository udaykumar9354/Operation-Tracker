const express = require('express');
const router = express.Router();
const commandingOfficerController = require('../controllers/commandingOfficer');

router.post('/', commandingOfficerController.createCommandingOfficer);

router.get('/', commandingOfficerController.getAllCommandingOfficers);
router.get('/:id', commandingOfficerController.getCommandingOfficerById);

router.patch('/:id', commandingOfficerController.patchCommandingOfficer);

router.delete('/:id', commandingOfficerController.deleteCommandingOfficer);
router.delete('/all', commandingOfficerController.deleteAllCommandingOfficers);

module.exports = router;