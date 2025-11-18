// server.js - Express server for EGL 2K Simulator
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const sim = require('./sim');
const shortid = require('shortid');

const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const STATE_FILE = path.join(DATA_DIR, 'leagueState.json');

function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { return null; }
}

function saveJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

let players = loadJSON(PLAYERS_FILE) || [];
let teams = loadJSON(TEAMS_FILE) || [];
let games = loadJSON(GAMES_FILE) || [];

// Load or initialize league state
let leagueState = loadJSON(STATE_FILE);
if (!leagueState) {
  leagueState = {
    id: shortid.generate(),
    players,
    teams,
    games,
    draft: { order: [], picks: [] },
    schedule: [],
    standings: {},
    playoffs: null,
    settings: {
      matchMode: "highestSingle", // or "sumTopN"
      seasonWeeks: 5
    }
  };
  saveJSON(STATE_FILE, leagueState);
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: fetch data
app.get('/api/players', (req, res) => {
  res.json(leagueState.players);
});
app.get('/api/teams', (req, res) => {
  res.json(leagueState.teams);
});
app.get('/api/games', (req, res) => {
  res.json(leagueState.games);
});
app.get('/api/league', (req, res) => {
  res.json(leagueState);
});

// Save league state (overwrite)
app.post('/api/league/save', (req, res) => {
  leagueState = req.body;
  saveJSON(STATE_FILE, leagueState);
  res.json({ ok: true });
});

// Draft endpoints
app.post('/api/draft/generate-order', (req, res) => {
  // generate wheel order for rounds 1 & 2
  const teamIds = leagueState.teams.map(t => t.id);
  const randomOrder = sim.shuffleArray(teamIds.slice());
  leagueState.draft.order = randomOrder;
  saveJSON(STATE_FILE, leagueState);
  res.json({ order: randomOrder });
});

app.post('/api/draft/run-full', (req, res) => {
  // run full draft: 3 rounds. Assumes some players may be unassigned.
  const userTeamId = req.body.userTeamId || null; // if provided, include prompt picks on frontend
  const result = sim.runFullDraft(leagueState, userTeamId);
  leagueState = result.leagueState;
  saveJSON(STATE_FILE, leagueState);
  res.json(result);
});

// Quick 1v1 simulate
app.post('/api/simulate/1v1', (req, res) => {
  const { playerAId, playerBId, gameId } = req.body;
  if (!playerAId || !playerBId || !gameId) return res.status(400).json({ error: 'missing params' });
  const result = sim.simulate1v1(leagueState, playerAId, playerBId, gameId);
  res.json(result);
});

// Generate season schedule (group stage, 5 weeks, one bye per team)
app.post('/api/schedule/generate', (req, res) => {
  const weeks = req.body.weeks || leagueState.settings.seasonWeeks || 5;
  const schedule = sim.generateSchedule(leagueState.teams, weeks);
  leagueState.schedule = schedule;
  saveJSON(STATE_FILE, leagueState);
  res.json({ schedule });
});

// Simulate a week (simulate all matches scheduled in that week)
app.post('/api/schedule/simulate-week', (req, res) => {
  const weekIndex = req.body.weekIndex;
  if (weekIndex == null) return res.status(400).json({ error: 'missing weekIndex' });
  const result = sim.simulateWeek(leagueState, weekIndex);
  leagueState = result.leagueState;
  saveJSON(STATE_FILE, leagueState);
  res.json(result);
});

// Run full season (simulate all weeks + playoffs)
app.post('/api/season/run-full', (req, res) => {
  const result = sim.runFullSeason(leagueState);
  leagueState = result.leagueState;
  saveJSON(STATE_FILE, leagueState);
  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EGL 2K Simulator server listening on port ${PORT}`);
});
