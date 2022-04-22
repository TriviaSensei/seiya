const MLBStatsAPI = require('mlb-stats-api');
const stats = new MLBStatsAPI();

module.exports = class playerStats {
	constructor(PID) {
		this.playerId = PID;
	}

	async getTeam() {
		const res = await stats.getTeams({
			pathParams: {
				sportId: 1,
			},
		});

		if (res.data.teams && Array.isArray(res.data.teams)) {
			const teams = res.data.teams.filter((t) => {
				return t.sport.id === 1;
			});

			const rosters = await Promise.all(
				teams.map(async (t) => {
					const res = await stats.getTeamRoster({
						pathParams: {
							teamId: t.id,
						},
					});
					return res.data.roster;
				})
			);
			let team = rosters.find((r) => {
				return r.some((p) => {
					return p.person.id === this.playerId;
				});
			});

			if (!team || team.length === 0) return null;

			return team[0].parentTeamId;
		}
		return null;
	}

	async getGamesByDate(date) {
		if (!this.teamId) {
			this.teamId = await this.getTeam();
		}
		const teamId = this.teamId;

		if (teamId !== 0 && !teamId) return [];

		try {
			const sched = await stats.getSchedule({
				params: { sportId: 1, date },
			});
			return sched.data.dates[0].games.filter((g) => {
				return (
					g.teams.away.team.id === teamId || g.teams.home.team.id === teamId
				);
			});
		} catch (e) {
			return [];
		}
	}

	async getPlayerStatsByDate(date) {
		const games = await this.getGamesByDate(date);
		if (!games || games.length === 0) return [];

		let data = games.map((g) => {
			return {
				gamePk: g.gamePk,
				gameDate: g.gameDate,
				officialDate: g.officialDate,
				status: g.status,
				gameNumber: g.gameNumber,
			};
		});

		const bsTemp = await Promise.all(
			games.map((g) => {
				return stats.getGameBoxscore({
					pathParams: {
						gamePk: g.gamePk,
					},
				});
			})
		);

		const boxScores = bsTemp.map((b) => {
			if (b.data.teams.home.team.id === this.teamId)
				return b.data.teams.home.players[`ID${this.playerId}`];
			if (b.data.teams.away.team.id === this.teamId)
				return b.data.teams.away.players[`ID${this.playerId}`];
			return null;
		});

		const teamInfo = bsTemp.map((b) => {
			return b.data.teams;
		});

		data = data.map((d, i) => {
			const i1 =
				bsTemp[i].data.teams.home.teamStats.pitching.inningsPitched.split('.');
			const i2 =
				bsTemp[i].data.teams.away.teamStats.pitching.inningsPitched.split('.');
			const inningsCompleted =
				i1.length === 2 && i2.length === 2
					? Math.min(parseInt(i1[0]), parseInt(i2[0]))
					: 0;

			const outs =
				i1.length === 2 && i2.length === 2
					? Math.max(parseInt(i1[1]), parseInt(i2[1]))
					: i1.length === 2
					? parseInt(i1[1])
					: i2.length === 2
					? parseInt(i2[1])
					: 0;

			let gameSituation = '';

			if (i1.length === 2 && i2.length === 2) {
				let currentInning = inningsCompleted + 1;
				if (d.status.codedGameState === 'I') {
					gameSituation = `${
						i1[0] === i2[0] ? 'Top' : 'Bottom'
					} ${currentInning}, ${outs} out`;
				} else if (
					d.status.codedGameState === 'F' &&
					d.status.abstractGameState === 'Final'
				) {
					gameSituation = `Final${
						bsTemp[i].data.teams.home.teamStats.pitching.inningsPitched ===
							'9.0' &&
						(bsTemp[i].data.teams.away.teamStats.pitching.inningsPitched ===
							'8.0' ||
							bsTemp[i].data.teams.away.teamStats.pitching.inningsPitched ===
								'9.0')
							? ''
							: `/${Math.floor(parseInt(i1[0]) - 0.1) + 1}`
					}`;
				} else if (
					d.status.detailedState === 'Postponed' ||
					d.status.detailedState === 'Warmup'
				) {
					gameSituation = d.status.detailedState;
				}
			}

			return {
				...d,
				gameSituation,
				teamInfo: teamInfo[i],
				boxScore: boxScores[i],
			};
		});

		data.sort((a, b) => {
			return a.gameNumber - b.gameNumber;
		});

		return data;
	}
};
