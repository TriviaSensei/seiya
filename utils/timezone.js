const moment = require('moment-timezone');

exports.getTimeZoneOffset = () => {
	const d = moment().tz('America/New_York').format();
	const NYHour = parseInt(d.split('T')[1].split(':')[0]);
	const UTCHour = new Date().getUTCHours();
	const offset = (24 + UTCHour - NYHour) % 24;
	return offset;
};
