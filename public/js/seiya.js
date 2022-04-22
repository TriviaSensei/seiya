let statLine = '';

const setPageElements = (data) => {
	/**
	 * Today
	 * Today Game on, no hit: Sei-NOT YET; current game stats
	 * Today Game on, hit: Sei-YA; current game stats
	 * Today game scheduled - show yesterday's result if applicable, otherwise Sei-NOT YET
	 * No game scheduled - show yesterday's result
	 * No game scheduled, no result yesterday - Sei-YA LATER
	 */

	const maxWidth = 400;

	let lastGame = null;
	let currentGame = null;
	let nextGame = null;
	let statLineGame = null;

	console.log(data.offset);

	for (var i = 0; i < data.today.length; i++) {
		if (data.today[i].status.codedGameState === 'F') {
			lastGame = data.today[i];
		} else if (data.today[i].status.codedGameState === 'I') {
			currentGame = data.today[i];
			break;
		} else if (
			data.today[i].status.codedGameState === 'P' ||
			data.today[i].status.codedGameState === 'S'
		) {
			nextGame = data.today[i];
			break;
		}
	}

	if (!lastGame) {
		for (var i = data.yesterday.length - 1; i >= 0; i--) {
			if (data.yesterday[i].status.codedGameState === 'F') {
				lastGame = data.yesterday[i];
				break;
			} else if (data.yesterday[i].status.codedGameState === 'I') {
				currentGame = data.yesterday[i];
				break;
			}
		}
	}

	const pic = document.getElementById('seiya-picture');
	const status = document.getElementById('status');
	const info = document.getElementById('game-info');

	let statusLine = '';

	if (currentGame) {
		statLineGame = currentGame;
		if (statLineGame.boxScore.stats.batting.hits === 0) {
			statusLine = 'Sei-NOT YET';
			status.classList.add('no-hit-yet');
			pic.src = '/img/seiya-bat.png';
		} else {
			statusLine = 'Sei-YAAAA!';
			status.classList.add('hit');
			pic.src = '/img/seiya-happy.png';
		}
	} else if (lastGame) {
		statLineGame = lastGame;
		if (statLineGame.boxScore.stats.batting.hits === 0) {
			statusLine = 'Sei-NOOOO!';
			status.classList.add('no-hit');
			pic.src = '/img/seiya-sad.png';
		} else {
			statusLine = 'Sei-YAAAA!';
			status.classList.add('hit');
			pic.src = '/img/seiya-happy.png';
		}
	} else if (nextGame) {
		statLineGame = nextGame;
		statusLine = 'Sei-NOT YET';
		status.classList.add('no-hit-yet');
		pic.src = '/img/seiya-bat.png';
	} else {
		statusLine = 'Sei-YA LATER';
		status.classList.add('no-hit-yet');
		pic.src = '/img/seiya-bat.png';
	}

	status.innerHTML = statusLine;

	if (statLineGame) {
		setStatLine(statLineGame);
	} else {
		document.getElementById('game-info').innerHTML = 'No game scheduled today';
	}
};

const addStat = (stats, abbr, attr) => {
	if (stats[attr] === 1) statLine = `${statLine.trim()}, ${abbr}`;
	else if (stats[attr] > 1)
		statLine = `${statLine.trim()}, ${stats[attr]} ${abbr}`;
};

const setStatLine = (game) => {
	let str = '';
	const teamId = game.boxScore.parentTeamId;
	const opponent = `
		${
			teamId === game.teamInfo.away.team.id
				? `@${game.teamInfo.home.team.abbreviation}`
				: `vs. ${game.teamInfo.away.team.abbreviation}`
		} `.trim();

	const homeScore = game.teamInfo.home.teamStats.batting.runs;
	const awayScore = game.teamInfo.away.teamStats.batting.runs;
	const score = `${
		teamId === game.teamInfo.away.team.id
			? `${awayScore}-${homeScore}`
			: `${homeScore}-${awayScore}`
	}`;
	let result;

	if (game.status.codedGameState !== 'F') {
		result = '';
	} else {
		result = `${
			teamId === game.teamInfo.away.team.id
				? `${awayScore > homeScore ? 'W' : 'L'}`
				: `${homeScore > awayScore ? 'W' : 'L'}`
		}`;
	}

	const gameSituation = game.gameSituation;

	if (game.status.codedGameState === 'I') {
		str = `${score} ${opponent}, ${gameSituation}<br>`;
	} else if (game.status.codedGameState === 'F') {
		str = `${result} ${score} ${opponent.trim()}, ${gameSituation}<br>`;
	} else if (game.status.codedGameState === 'P') {
		str = `Warmup ${opponent}`;
	} else if (game.status.codedGameState === 'S') {
		let UTCHour = parseInt(game.gameDate.split('T')[1].split(':')[0]);
		let min = game.gameDate.split('T')[1].split(':')[1];
		let ETHour = (24 + UTCHour - data.offset) % 24;
		let time = `${ETHour > 12 ? ETHour - 12 : ETHour}:${min} ${
			ETHour > 12 ? 'PM' : 'AM'
		} ET`;
		str = `Next game: today ${opponent.trim()}, ${time}`;
	}

	if (
		game.status.codedGameState === 'I' ||
		game.status.codedGameState === 'F'
	) {
		const s = game.boxScore.stats.batting;

		statLine = `${s.hits} for ${s.atBats}`;

		addStat(s, 'HR', 'homeRuns');
		addStat(s, '3B', 'triples');
		addStat(s, '2B', 'doubles');
		addStat(s, 'RBI', 'rbi');
		addStat(s, 'K', 'strikeOuts');
		addStat(s, 'BB', 'baseOnBalls');
		addStat(s, 'HBP', 'hitByPitch');

		str = `${str}${statLine}`;
	}

	document.getElementById('game-info').innerHTML = str;
};

document.addEventListener('DOMContentLoaded', () => {
	try {
		const req = new XMLHttpRequest();
		if (req.readyState == 0 || req.readyState == 4) {
			const date = new Date();
			const dateStr = `${date.getFullYear()}-${
				date.getMonth() + 1
			}-${date.getDate()}`;
			var requestStr = `/stats/${dateStr}`;
			req.open('GET', requestStr, true);
			req.onreadystatechange = () => {
				if (req.readyState == 4) {
					const res = JSON.parse(req.response);
					if (res.status === 'success') {
						setPageElements(res.data);
					} else {
						console.log(res);
					}
				}
			};
			req.setRequestHeader('Content-type', 'application/json; charset=utf-8');
			req.send(null);
		}
	} catch (err) {
		console.log('something went wrong');
	}
});
