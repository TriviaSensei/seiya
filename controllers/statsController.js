const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const stats = require('../utils/playerStats');
const tz = require('../utils/timezone');
const sg = new stats(673548);

exports.getStats = catchAsync(async (req, res, next) => {
	const today = new Date(req.params.date);
	const yesterday = new Date(req.params.date);
	yesterday.setDate(yesterday.getDate() - 1);

	if (today && yesterday) {
		const todayStats = await sg.getPlayerStatsByDate(req.params.date);
		const yesterdayStats = await sg.getPlayerStatsByDate(
			`${yesterday.getFullYear()}-${
				yesterday.getMonth() + 1
			}-${yesterday.getDate()}`
		);

		return res.status(200).json({
			status: 'success',
			data: {
				today: todayStats,
				yesterday: yesterdayStats,
				offset: tz.getTimeZoneOffset(),
			},
		});
	}
	return next(new AppError('Invalid date specified', 400));
});
