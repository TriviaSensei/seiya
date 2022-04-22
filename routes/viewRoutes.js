const express = require('express');
const viewsController = require('../controllers/viewsController');

const router = express.Router();

router.get(
	'/',

	viewsController.getIndex
);

module.exports = router;
