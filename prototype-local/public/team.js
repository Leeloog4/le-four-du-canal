const $ = id => document.getElementById(id);
let currentUser, participants = [], editingId, currentTab = 'participants';
const states = { pending: 'En attente', processing: 'En cours — vérifier si bloqué', simulated: 'Simulé · aucun envoi', accepted: 'Accepté par Brevo', failed: 'Échec', uncertain: 'Résultat incertain', skipped: 'Non prévu / annulé' };
const date = value => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(value));
function node(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }
function cell(row, text) { const e = node('td', text); row.append(e); return e; }
function action(label, callback) { const e = node('button', label, 'text-button'); e.type = 'button'; e.addEventListener('click', callback); return e; }
function message(text, error = false) { $('team-message').textContent = text; $('team-message').className = text ? 'notice ' + (error ? 'error' : 'success') : ''; }
async function api(path, options = {}) {
  const response = await fetch('/api/' + path, { ...options, headers: { 'Content-Type': 'application/json' }, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== 'login') showLogin();
    throw new Error(data.error || 'Demande impossible.');
  }
  return data;
}
function showLogin() { currentUser = null; participants = []; $('workspace').hidden = true; $('login-panel').hidden = false; $('logout').hidden = true; for (const id of ['participants-body', 'ranking-body', 'emails-body']) $(id).replaceChildren(); $('score-dialog').close(); }
function showWorkspace(user) {
  currentUser = user; $('workspace').hidden = false; $('login-panel').hidden = true; $('logout').hidden = false;
  $('identity').textContent = `${user.email} · ${user.role === 'organizer' ? 'Organisateur' : 'Jury'}`;
  $('tab-emails').hidden = user.role !== 'organizer';
  $('participant-help').textContent = user.role === 'jury' ? 'Les coordonnées restent privées. Vous pouvez saisir et modifier les trois notes de chaque participation active.' : 'Vous pouvez retirer ou réactiver une participation. La saisie des notes est réservée au jury. Un retrait annule les e-mails encore en attente ; une réactivation ne les reprogramme pas.';
}
async function load() {
  if (!currentUser) return;
  $('refresh').disabled = true;
  try {
    const data = await api('participants'); participants = data.participants;
    $('participant-count').textContent = participants.length + ' au total';
    $('participants-empty').hidden = participants.length > 0;
    $('participants-head').replaceChildren(...['Participant', ...(currentUser.role === 'organizer' ? ['E-mail'] : []), 'Statut', 'Notes /30', 'Action'].map(v => { const th = node('th', v); th.scope = 'col'; return th; }));
    $('participants-body').replaceChildren(...participants.map(p => {
      const tr = node('tr'); cell(tr, p.first_name + ' ' + p.last_name);
      if (currentUser.role === 'organizer') cell(tr, p.email);
      cell(tr, p.status === 'registered' ? 'Inscrit' : 'Retiré');
      cell(tr, p.scores ? p.scores.taste + p.scores.texture + p.scores.presentation + ' / 30' : 'À évaluer');
      const actions = cell(tr);
      if (currentUser.role === 'jury' && p.status === 'registered') actions.append(action(p.scores ? 'Modifier les notes' : 'Évaluer ↗', () => openScores(p)));
      else if (currentUser.role === 'organizer') actions.append(action(p.status === 'registered' ? 'Retirer' : 'Réactiver', async () => {
        if (!confirm(p.status === 'registered' ? 'Retirer cette participation ? Ses e-mails en attente seront annulés.' : 'Réactiver cette participation ? Les e-mails annulés ne seront pas reprogrammés.')) return;
        try { await api('participants/' + p.id, { method: 'PATCH', body: { status: p.status === 'registered' ? 'withdrawn' : 'registered' } }); message('Statut enregistré.'); await load(); }
        catch (e) { message(e.message, true); }
      }));
      else actions.textContent = '—';
      return tr;
    }));
    const { ranking } = await api('ranking');
    $('ranking-empty').hidden = ranking.length > 0;
    $('ranking-body').replaceChildren(...ranking.map(p => { const tr = node('tr'); for (const v of [p.rank + (p.tied ? ' ex æquo' : ''), p.first_name + ' ' + p.last_name, p.taste, p.texture, p.presentation, p.total]) cell(tr, v); return tr; }));
    if (currentUser.role === 'organizer') {
      const { emails } = await api('emails'); $('emails-empty').hidden = emails.length > 0;
      $('emails-body').replaceChildren(...emails.map(m => {
        const tr = node('tr'); cell(tr, m.recipient); cell(tr, m.kind === 'confirmation' ? 'Confirmation' : 'Rappel J−1'); cell(tr, date(m.due_at));
        cell(tr).append(node('span', states[m.state] || m.state, 'pill ' + m.state));
        const details = node('details'); details.append(node('summary', 'Voir le contenu'));
        details.append(node('strong', m.subject), node('pre', m.content));
        if (m.message_id) details.append(node('p', 'Identifiant Brevo : ' + m.message_id));
        if (m.last_error) details.append(node('p', m.last_error, 'field-error'));
        cell(tr).append(details); return tr;
      }));
    }
  } catch (e) { message(e.message, true); }
  finally { $('refresh').disabled = false; }
}
function switchTab(tab) {
  currentTab = tab;
  for (const name of ['participants', 'ranking', 'emails']) {
    $('view-' + name).hidden = name !== tab;
    $('tab-' + name).classList.toggle('active', name === tab);
    $('tab-' + name).setAttribute('aria-pressed', String(name === tab));
  }
}
for (const tab of ['participants', 'ranking', 'emails']) $('tab-' + tab).addEventListener('click', () => switchTab(tab));
$('refresh').addEventListener('click', load);
$('login').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { const { user } = await api('login', { method: 'POST', body: Object.fromEntries(new FormData(event.target)) }); $('login-password').value = ''; message(''); showWorkspace(user); switchTab('participants'); await load(); }
  catch (e) { message(e.message, true); }
  finally { button.disabled = false; }
});
$('logout').addEventListener('click', async () => {
  try { await api('logout', { method: 'POST', body: {} }); showLogin(); message('Vous êtes déconnecté.'); }
  catch (e) { message(e.message, true); }
});
function openScores(p) {
  editingId = p.id; $('score-title').textContent = p.first_name + ' ' + p.last_name;
  for (const key of ['taste', 'texture', 'presentation']) $(key).value = p.scores?.[key] ?? '';
  $('score-error').textContent = ''; $('score-dialog').showModal();
}
$('cancel-score').addEventListener('click', () => $('score-dialog').close());
$('score-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { await api('scores/' + editingId, { method: 'PUT', body: Object.fromEntries([...new FormData(event.target)].map(([key, value]) => [key, Number(value)])) }); $('score-dialog').close(); message('Évaluation enregistrée. Le classement a été recalculé.'); await load(); }
  catch (e) { $('score-error').textContent = e.message; }
  finally { button.disabled = false; }
});
try { const { user } = await api('me'); showWorkspace(user); switchTab(currentTab); await load(); }
catch (e) { showLogin(); if (!e.message.includes('Connectez-vous')) message(e.message, true); }
