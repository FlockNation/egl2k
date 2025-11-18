// public/app.js - frontend logic
async function api(path, method='GET', body=null) {
  const opts = { method, headers: {} };
  if (body) { opts.body = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json'; }
  const res = await fetch('/api' + path, opts);
  if (!res.ok) throw new Error('API error ' + res.status);
  return await res.json();
}

let league = null;

async function loadLeague() {
  league = await api('/league');
  if (league && league.players && league.players.length === 0) {
    // initial load: fetch base data endpoints
    const players = await api('/players');
    const teams = await api('/teams');
    const games = await api('/games');
    league.players = players; league.teams = teams; league.games = games;
  }
  populateSelectors();
}
function populateSelectors() {
  const pA = document.getElementById('q_pA');
  const pB = document.getElementById('q_pB');
  const gSel = document.getElementById('q_game');
  const fSel = document.getElementById('f_team');
  pA.innerHTML = '<option value="">--select--</option>';
  pB.innerHTML = '<option value="">--select--</option>';
  (league.players || []).forEach(p => {
    const label = p.displayName + (p.tier === 0 ? ' (Leader)' : ' (Tier ' + p.tier + ')');
    pA.add(new Option(label, p.id));
    pB.add(new Option(label, p.id));
  });
  gSel.innerHTML = '';
  (league.games || []).forEach(g => gSel.add(new Option(g.title + (g.scratchProjectId ? ' [id:'+g.scratchProjectId+']' : ''), g.id)));
  fSel.innerHTML = '<option value="">--choose franchise--</option>';
  (league.teams || []).forEach(t => fSel.add(new Option(t.name + ' — ' + t.city, t.id)));
}

document.getElementById('q_sim').addEventListener('click', async () => {
  try {
    const a = document.getElementById('q_pA').value;
    const b = document.getElementById('q_pB').value;
    const g = document.getElementById('q_game').value;
    if (!a || !b || a === b) return alert('Pick two different players');
    const res = await api('/simulate/1v1', 'POST', { playerAId: a, playerBId: b, gameId: g });
    const out = document.getElementById('q_out');
    out.textContent = `Game: ${res.game.title}\n${res.playerA.name} -> ${res.playerA.score}\n${res.playerB.name} -> ${res.playerB.score}\nWinner: ${res.winner || 'Tie'}`;
  } catch (e) { alert('Error: ' + e.message); }
});

document.getElementById('f_start').addEventListener('click', async () => {
  const tid = document.getElementById('f_team').value;
  if (!tid) return alert('Choose a franchise');
  const team = league.teams.find(t => t.id === tid);
  renderTeamInfo(team);
});

function renderTeamInfo(team) {
  const container = document.getElementById('f_info');
  const roster = (team.roster || []).map(pid => league.players.find(p => p.id === pid));
  let html = `<h3>${team.name} — ${team.city}</h3>`;
  html += `<p>Leader: ${league.players.find(p => p.id === team.leaderId)?.displayName || team.leaderId}</p>`;
  html += `<ul>`;
  roster.forEach(r => html += `<li>${r.displayName} — ${r.tier === 0 ? 'Leader' : 'Tier ' + r.tier}</li>`);
  html += `</ul>`;
  container.innerHTML = html;
}

document.getElementById('d_generate').addEventListener('click', async () => {
  const res = await api('/draft/generate-order', 'POST', {});
  document.getElementById('draft_log').textContent = 'Draft order generated: ' + res.order.join(', ');
  await loadLeague(); // refresh
});

document.getElementById('d_run').addEventListener('click', async () => {
  const tid = document.getElementById('f_team').value || null;
  const res = await api('/draft/run-full', 'POST', { userTeamId: tid });
  document.getElementById('draft_log').textContent = 'Draft picks:\n' + res.picks.map(p => `${p.round}. ${p.teamId} -> ${p.pick || 'none'}`).join('\n');
  await api('/league/save', 'POST', league); // save
  await loadLeague();
});

document.getElementById('s_generate').addEventListener('click', async () => {
  const weeks = parseInt(document.getElementById('s_weeks').value || 5);
  const res = await api('/schedule/generate', 'POST', { weeks });
  renderSchedule(res.schedule);
  await loadLeague();
});
function renderSchedule(schedule) {
  const view = document.getElementById('schedule_view');
  if (!schedule) { view.innerHTML = ''; return; }
  let html = '';
  schedule.forEach(w => {
    html += `<h4>Week ${w.week}</h4>`;
    if (w.matches && w.matches.length) {
      html += '<ul>';
      w.matches.forEach(m => html += `<li>${m[0]} vs ${m[1]}</li>`);
      html += '</ul>';
    } else html += '<p>No matches</p>';
    if (w.byes && w.byes.length) html += `<p>Byes: ${w.byes.join(', ')}</p>`;
  });
  view.innerHTML = html;
}

document.getElementById('s_runfull').addEventListener('click', async () => {
  const res = await api('/season/run-full', 'POST', {});
  document.getElementById('standings_view').textContent = 'Season complete. Standings (ordered):\n' + res.standingsArr.map(s => `${s.teamId} - wins:${s.wins}`).join('\n');
  document.getElementById('playoffs_view').textContent = 'Champion: ' + (res.awards ? res.awards.champion : 'N/A');
  await loadLeague();
});

document.getElementById('save_state').addEventListener('click', async () => {
  try {
    await api('/league/save', 'POST', league);
    document.getElementById('admin_out').textContent = 'Saved';
  } catch (e) { document.getElementById('admin_out').textContent = 'Error: ' + e.message; }
});
document.getElementById('reload_state').addEventListener('click', async () => {
  await loadLeague();
  document.getElementById('admin_out').textContent = 'Reloaded';
});
document.getElementById('export_state').addEventListener('click', () => {
  const data = JSON.stringify(league, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'leagueState.json'; document.body.appendChild(a); a.click(); a.remove();
});

loadLeague().catch(err => console.error(err));
