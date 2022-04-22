process.on('uncaughtException', (err) => {
	console.log('Uncaught exception');
	console.log(err.name, err.message);
	console.log(err);
	process.exit(1);
});

const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const AppError = require('./utils/appError');
const viewRouter = require('./routes/viewRoutes');
const statsRouter = require('./routes/statRoutes');
const errorHandler = require('./controllers/errorController');
const app = express();

dotenv.config({ path: './config.env' });

const port = process.env.PORT || 3000;

const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many reports from this IP - please try again later.',
});

const server = app.listen(port, () => {
	console.log(`App running on port ${port}`);
});
app.set('view engine', 'pug');
//directory for views is /views
app.set('views', path.join(__dirname, 'views'));
//serving static files
//all static files (css, js, images) will be served from this folder as a result
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use('/', limiter, viewRouter);
app.use('/stats', limiter, statsRouter);

process.on('unhandledRejection', async (err) => {
	console.log(err.name, err.message);
	console.log(err);
	console.log('Unhandled rejection. Shutting down.');

	// await new Email(null, null).alertUnhandledRejection();

	server.close(() => {
		process.exit(1);
	});
});

process.on('SIGTERM', async () => {
	console.log('SIGTERM RECEIVED. Shutting down.');

	// await new Email(null, null).alertSigterm();

	server.close(() => {
		console.log('Process terminated.');
	});
});
