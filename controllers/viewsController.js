const catchAsync = require('../utils/catchAsync');

exports.getIndex = catchAsync(async (req, res, next) => {
	res.status(200).render('index', {});
});
