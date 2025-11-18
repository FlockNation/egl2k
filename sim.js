// sim.js - Core simulation & draft logic for EGL 2K Simulator

const fs = require('fs');
const path = require('path');
const shortid = require('shortid');

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function computeBaseSkill(player) {
  // tier mapping:
  // leader: tier===0, provide baseline but leaders don't count toward tier slots
  if (player.tier === 0) return 70 + deterministicHash(player.id) % 10;
  if (player.tier === 1) return 92 + deterministicHash(player.id) % 6;
  if (player.tier === 2) return 80 + deterministicHash(player.id) % 8;
  // tier 3
  return 64 + deterministicHash(player.id) % 7;
}
function deterministicHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function simulatePlayerScoreForGame(player, game) {
  const base = computeBaseSkill(player);
  const difficultyModifier = 1 + (game.difficulty - 5) / 20; // diff 5 neutral
  const noise = 0.85 + Math.random() * 0.3; // 0.85..1.15
  return Math.round(base * difficultyModifier * (game.weight || 1) * noise);
}

function simulate1v1(leagueState, playerAId, playerBId, gameId) {
  const players = leagueState.players;
  const games = leagueState.games;
  const a = players.find(p => p.id === playerAId);
  const b = players.find(p => p.id === playerBId);
  const g = games.find(x => x.id === gameId);
  if (!a || !b || !g) return { error: 'invalid ids' };
  const sa = simulatePlayerScoreForGame(a, g);
  const sb = simulatePlayerScoreForGame(b, g);
  const winner = sa > sb ? a.id : (sb > sa ? b.id : null);
  return {
    game: g,
    playerA: { id: a.id, name: a.displayName, score: sa },
    playerB: { id: b.id, name: b.displayName, score: sb },
    winner
  };
}

/* Draft logic:
 - 3 rounds
 - Round1 pool: all tiers
 - Round2 pool: tier2 & tier3
 - Round3 pool: tier3 only
 - Round3 order: teams ordered by leader joinDate ascending
 - Each team may only have 1 player per tier (leader excluded)
 - If a team already has the tier, it cannot pick that tier.
 - AI pick: choose highest baseSkill candidate that fits, with 75% chance top pick and 25% random among top 3
*/

function runFullDraft(leagueState, userTeamId) {
  // mutate a copy of leagueState and return result
  const state = clone(leagueState);
  const teams = state.teams;
  const players = state.players;

  // ensure draft order exists for rounds 1&2
  let order12 = state.draft.order && state.draft.order.length ? state.draft.order.slice() : shuffleArray(teams.map(t => t.id));
  state.draft.order = order12;

  // compute third round order by leader joinDate
  const teamJoinPairs = teams.map(t => {
    const leader = players.find(p => p.id === t.leaderId);
    return { id: t.id, joinDate: leader ? leader.joinDate : '9999-01-01' };
  });
  teamJoinPairs.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
  const order3 = teamJoinPairs.map(x => x.id);

  const rounds = [
    { num: 1, order: order12, allowedTiers: [1, 2, 3] },
    { num: 2, order: order12, allowedTiers: [2, 3] },
    { num: 3, order: order3, allowedTiers: [3] }
  ];

  const picks = [];
  for (const round of rounds) {
    for (const tid of round.order) {
      // choose candidate
      const team = teams.find(t => t.id === tid);
      const candidate = aiOrUserPick(players, team, round.allowedTiers, userTeamId === tid);
      if (!candidate) {
        picks.push({ teamId: tid, pick: null, reason: 'no-available-candidate', round: round.num });
        continue;
      }
      // assign
      candidate.teamId = team.id;
      team.roster = team.roster || [];
      team.roster.push(candidate.id);
      picks.push({ teamId: tid, pick: candidate.id, round: round.num });
    }
  }

  state.draft.picks = (state.draft.picks || []).concat(picks);
  return { leagueState: state, picks };
}

function aiOrUserPick(players, team, allowedTiers, isUser) {
  // Filter unassigned players, keep only allowed tiers and those team doesn't already have
  const unassigned = players.filter(p => !p.teamId || p.teamId === null);
  const existingTiers = (team.roster || []).map(pid => {
    const p = players.find(x => x.id === pid);
    return p ? p.tier : null;
  }).filter(Boolean);
  let candidates = unassigned.filter(p => allowedTiers.includes(p.tier) && !existingTiers.includes(p.tier));
  // if user, return null to indicate frontend should prompt; but for server auto-pick for user too
  if (isUser) {
    // return null to force frontend to ask. But in this server-run-full flow, we simulate user as AI pick.
    // To keep server-run-full deterministic, we simulate user with AI logic.
  }
  if (!candidates.length) return null;
  // rank by baseSkill
  candidates.sort((a, b) => computeBaseSkill(b) - computeBaseSkill(a));
  if (Math.random() < 0.75) return candidates[0];
  const topK = Math.min(3, candidates.length);
  return candidates[Math.floor(Math.random() * topK)];
}

/* Schedule generation:
 - For simplicity we create a round-robin within conference-style split: but since teams are 10, we'll produce 5 weeks where each team has 4 matchups and 1 bye is required by your rule.
 - We'll generate pairings per week so that each team plays 4 out of the other 9 teams across the 5 weeks and has one bye (no opponent) once.
 - This implementation creates balanced random schedules with one bye per team.
*/
function generateSchedule(teams, weeks = 5) {
  const teamIds = teams.map(t => t.id);
  // create pool of possible pairings (unordered pairs)
  const pairs = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) pairs.push([teamIds[i], teamIds[j]]);
  }
  shuffleArray(pairs);
  // assign pairs to weeks trying to avoid duplicate opponents per team
  const weeksArr = Array.from({ length: weeks }, (_, i) => ({ week: i + 1, matches: [] }));
  const played = {}; // played[teamId] = set of opponents
  teamIds.forEach(t => played[t] = new Set());

  for (const pair of pairs) {
    // find a week where both teams are free and haven't played each other before and team has not exceeded matches
    for (const w of weeksArr) {
      const t1 = pair[0], t2 = pair[1];
      const playsThisWeek = w.matches.flat();
      const inWeek = w.matches.some(m => m.includes(t1) || m.includes(t2));
      if (inWeek) continue;
      if (played[t1].has(t2) || played[t2].has(t1)) continue;
      // ensure each team's planned matches < weeks - 1 (one bye)
      const t1Matches = Array.from(played[t1]).length;
      const t2Matches = Array.from(played[t2]).length;
      if (t1Matches >= weeks - 1 || t2Matches >= weeks - 1) continue;
      w.matches.push([t1, t2]);
      played[t1].add(t2);
      played[t2].add(t1);
      break;
    }
  }

  // For any team with fewer than weeks - 1 matches, give byes automatically (some weeks may have fewer matches)
  // For clarity return array of weeks with matches and list of byes
  weeksArr.forEach(w => {
    const participating = new Set(w.matches.flat());
    w.byes = teamIds.filter(t => !participating.has(t));
  });
  return weeksArr;
}

/* Simulate a week:
 - For each match this week simulate a matchup by selecting the highest player score per team (default) OR sum top N if configured.
 - Winner gets a win, update standings.
*/
function simulateWeek(leagueState, weekIndex) {
  const week = leagueState.schedule[weekIndex];
  if (!week) return { error: 'no such week' };
  const games = leagueState.games;
  const players = leagueState.players;
  const teams = leagueState.teams;

  leagueState.standings = leagueState.standings || {};
  // ensure every team in standings
  teams.forEach(t => {
    leagueState.standings[t.id] = leagueState.standings[t.id] || { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };
  });

  const matchResults = [];
  for (const match of week.matches) {
    // pick a random game for the week
    const game = games[Math.floor(Math.random() * games.length)];
    const [tAId, tBId] = match;
    const tA = teams.find(t => t.id === tAId);
    const tB = teams.find(t => t.id === tBId);
    // compute team score: highest single player on roster
    const scoreA = teamScoreFromGame(tA, players, game);
    const scoreB = teamScoreFromGame(tB, players, game);
    // update standings
    if (scoreA > scoreB) { leagueState.standings[tAId].wins++; leagueState.standings[tBId].losses++; }
    else if (scoreB > scoreA) { leagueState.standings[tBId].wins++; leagueState.standings[tAId].losses++; }
    else { leagueState.standings[tAId].ties++; leagueState.standings[tBId].ties++; }
    leagueState.standings[tAId].pointsFor += scoreA;
    leagueState.standings[tAId].pointsAgainst += scoreB;
    leagueState.standings[tBId].pointsFor += scoreB;
    leagueState.standings[tBId].pointsAgainst += scoreA;

    matchResults.push({ match: [tAId, tBId], gameId: game.id, scoreA, scoreB, winner: scoreA > scoreB ? tAId : (scoreB > scoreA ? tBId : null) });
  }

  return { leagueState, matchResults, weekIndex };
}

function teamScoreFromGame(team, players, game) {
  const roster = (team.roster || []).map(id => players.find(p => p.id === id)).filter(Boolean);
  if (!roster.length) return 0;
  // highest single player score counts
  let best = -Infinity;
  roster.forEach(p => {
    const s = simulatePlayerScoreForGame(p, game);
    if (s > best) best = s;
  });
  return best;
}

/* Run full season: simulate all weeks and run play-ins & playoffs.
 - After group stage, compute top3 per group (we don't have groups by conference explicitly in data; we'll treat top 5 by standings as "top 5", bottom two play-ins per the rule).
 - For simplicity: treat teams as single conference split into top/bottom for play-ins.
*/
function runFullSeason(leagueState) {
  // simulate each week
  for (let wi = 0; wi < leagueState.schedule.length; wi++) {
    simulateWeek(leagueState, wi);
  }
  // compute standings array sorted by wins, then pointsFor
  const standingsArr = Object.keys(leagueState.standings).map(tid => {
    const s = leagueState.standings[tid];
    return { teamId: tid, wins: s.wins, ties: s.ties, pointsFor: s.pointsFor };
  });
  standingsArr.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pointsFor - a.pointsFor;
  });

  // play-in: bottom 4 teams (seed 7-10) play (7 vs 10 and 8 vs 9) and winners join top 6 for an 8-team playoff
  // For our 10 team league:
  const top6 = standingsArr.slice(0, 6).map(s => s.teamId);
  const playInTeams = standingsArr.slice(6).map(s => s.teamId); // 4 teams
  // pair: 1st play-in match: playInTeams[0] vs playInTeams[3], second: playInTeams[1] vs playInTeams[2]
  const playInResults = [];
  if (playInTeams.length === 4) {
    const p1 = simulatePlayInMatch(leagueState, playInTeams[0], playInTeams[3]);
    const p2 = simulatePlayInMatch(leagueState, playInTeams[1], playInTeams[2]);
    playInResults.push(p1, p2);
    const winners = playInResults.filter(r => r.winner).map(r => r.winner);
    const playoffTeams = top6.concat(winners).slice(0, 8);
    // run single-elimination bracket for playoffs (quarter, semi, final)
    const playoffResults = runPlayoffs(leagueState, playoffTeams);
    leagueState.playoffs = { playInResults, playoffResults };
  } else {
    // fallback: if not exactly 4 play-in teams, just pick top 8
    const top8 = standingsArr.slice(0, 8).map(s => s.teamId);
    const playoffResults = runPlayoffs(leagueState, top8);
    leagueState.playoffs = { playInResults: [], playoffResults };
  }

  // produce awards
  const awards = computeAwards(leagueState, standingsArr);
  leagueState.awards = awards;
  return { leagueState, standingsArr, awards };
}

function simulatePlayInMatch(leagueState, tAId, tBId) {
  const game = leagueState.games[Math.floor(Math.random() * leagueState.games.length)];
  const teamA = leagueState.teams.find(t => t.id === tAId);
  const teamB = leagueState.teams.find(t => t.id === tBId);
  const sA = teamScoreFromGame(teamA, leagueState.players, game);
  const sB = teamScoreFromGame(teamB, leagueState.players, game);
  return { teams: [tAId, tBId], winner: sA > sB ? tAId : (sB > sA ? tBId : null), scoreA: sA, scoreB: sB, gameId: game.id };
}

function runPlayoffs(leagueState, teamIds) {
  // single-elim bracket, seed order is order of teamIds array (quarterfinals seeded)
  let roundTeams = teamIds.slice();
  const rounds = [];
  while (roundTeams.length > 1) {
    const nextRound = [];
    const matches = [];
    // pair 0 vs last, 1 vs last-1, etc.
    for (let i = 0; i < roundTeams.length / 2; i++) {
      const tA = roundTeams[i];
      const tB = roundTeams[roundTeams.length - 1 - i];
      const res = simulatePlayInMatch(leagueState, tA, tB);
      matches.push(res);
      if (res.winner) nextRound.push(res.winner);
    }
    rounds.push({ matches });
    roundTeams = nextRound;
  }
  const champion = roundTeams[0] || null;
  return { rounds, champion };
}

function computeAwards(leagueState, standingsArr) {
  const awards = {};
  // MVP -> player with highest total pointsFor across season (approx. we didn't record per-player weekly points; approximate via baseSkill * games weight)
  // We'll compute a crude metric: baseSkill * frequency (teams' matches)
  const playerScores = leagueState.players.map(p => {
    return { id: p.id, score: computeBaseSkill(p) };
  });
  playerScores.sort((a, b) => b.score - a.score);
  awards.mvp = playerScores[0] ? playerScores[0].id : null;
  awards.champion = leagueState.playoffs ? leagueState.playoffs.playoffResults.champion : null;
  return awards;
}

module.exports = {
  shuffleArray,
  computeBaseSkill,
  simulatePlayerScoreForGame,
  simulate1v1,
  runFullDraft,
  generateSchedule,
  simulateWeek,
  runFullSeason
};
