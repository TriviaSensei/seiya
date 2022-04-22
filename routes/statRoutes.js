const express = require('express');
const statsController = require('../controllers/statsController');

const router = express.Router();

router.get('/:date', statsController.getStats);

module.exports = router;
