const express = require('express');
const router = express.Router();
const convoyController = require('../controllers/convoys');

router.post('/', convoyController.createConvoy);

router.get('/', convoyController.getAllConvoys);
router.get('/:id', convoyController.getConvoyById)


router.put('/:id', convoyController.updateConvoy);

router.patch('/:id', convoyController.patchConvoy);

router.delete('/all', convoyController.deleteAllConvoys);
router.delete('/:id', convoyController.deleteConvoy);


module.exports = router;
