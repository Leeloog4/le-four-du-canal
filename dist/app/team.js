const baseUrl = 'https://xeeixhbhfsdxrgeotlix.supabase.co';
const publicKey = 'sb_publishable_UWnzlp30PvZJbIUS09Z5nQ_oWaT37AM';
const $ = id => document.getElementById(id);
const loginButton = $('login').querySelector('button[type="submit"]');
let session = null, expiryTimer, generation = 0;
let editingParticipant = null, savingScores = false;
let changingStatus = false;

function completeScores(scores) {
  return scores && ['taste', 'texture', 'presentation'].every(key => Number.isInteger(scores[key]) && scores[key] >= 0 && scores[key] <= 10);
}
function closeScores() {
  if ($('score-dialog').open) $('score-dialog').close();
  editingParticipant = null;
  for (const key of ['taste', 'texture', 'presentation']) $(key).value = '';
  $('score-error').textContent = '';
}

function message(text, error = false) {
  $('team-message').textContent = text;
  $('team-message').className = text ? 'notice ' + (error ? 'error' : 'success') : '';
}
function showView(view) {
  $('participants-panel').hidden = view !== 'participants';
  $('ranking-panel').hidden = view !== 'ranking';
  for (const name of ['participants', 'ranking']) {
    $('view-' + name).className = view === name ? 'active' : '';
    $('view-' + name).setAttribute('aria-pressed', String(view === name));
  }
}
function renderRanking(participants) {
  const ranked = participants
    .filter(participant => participant.status === 'registered' && completeScores(participant.scores))
    .map(participant => ({ ...participant, total: participant.scores.taste + participant.scores.texture + participant.scores.presentation }))
    .sort((a, b) => b.total - a.total);
  const counts = new Map();
  for (const participant of ranked) counts.set(participant.total, (counts.get(participant.total) || 0) + 1);
  let rank = 0;
  $('ranking-body').replaceChildren(...ranked.map((participant, index) => {
    if (index === 0 || participant.total !== ranked[index - 1].total) rank = index + 1;
    const row = document.createElement('tr');
    for (const value of [rank + (counts.get(participant.total) > 1 ? ' ex æquo' : ''), participant.first_name + ' ' + participant.last_name, participant.scores.taste, participant.scores.texture, participant.scores.presentation, participant.total + ' / 30']) {
      const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell);
    }
    return row;
  }));
  $('ranking-count').textContent = ranked.length + ' au classement';
  $('ranking-empty').hidden = ranked.length > 0;
}
function clearSession() {
  generation++;
  session = null;
  closeScores();
  clearTimeout(expiryTimer);
  $('workspace').hidden = true;
  $('login-panel').hidden = false;
  $('logout').hidden = true;
  $('participants-head').replaceChildren();
  $('participants-body').replaceChildren();
  $('ranking-body').replaceChildren();
  $('ranking-count').textContent = '';
  $('ranking-empty').hidden = true;
  showView('participants');
  $('identity').textContent = '';
  $('participant-count').textContent = '';
  $('participants-empty').hidden = true;
  $('login-password').value = '';
}
async function revoke(token) {
  try {
    await fetch(baseUrl + '/auth/v1/logout?scope=local', {
      method: 'POST', headers: { apikey: publicKey, Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(10000)
    });
  } catch { /* La session est déjà effacée de cette page. */ }
}
function render(data) {
  const organizer = data.user.role === 'organizer';
  session.role = data.user.role;
  $('identity').textContent = data.user.email + ' · ' + (organizer ? 'Organisateur' : 'Jury');
  $('participant-help').textContent = organizer
    ? 'Consultez les évaluations et gérez les participations. Un retrait conserve les données et les notes, mais exclut la participation du classement.'
    : 'Évaluez chaque participation active. Les coordonnées des participants sont réservées à l’organisateur.';
  $('participants-head').replaceChildren(...['Participant', ...(organizer ? ['E-mail'] : []), 'Statut', 'Inscription (Paris)', 'Évaluation / 30', 'Action'].map(value => {
    const th = document.createElement('th'); th.textContent = value; th.scope = 'col'; return th;
  }));
  $('participants-body').replaceChildren(...data.participants.map(participant => {
    const tr = document.createElement('tr');
    const createdAt = new Date(participant.created_at);
    const date = Number.isNaN(createdAt.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(createdAt);
    for (const value of [participant.first_name + ' ' + participant.last_name, ...(organizer ? [participant.email] : []), participant.status === 'registered' ? 'Inscrit' : 'Retiré', date]) {
      const td = document.createElement('td'); td.textContent = value; tr.append(td);
    }
    const evaluation = document.createElement('td');
    const scores = participant.scores;
    evaluation.textContent = completeScores(scores)
      ? `Goût ${scores.taste} · Texture ${scores.texture} · Présentation ${scores.presentation} — ${scores.taste + scores.texture + scores.presentation} / 30`
      : 'À évaluer';
    tr.append(evaluation);
    if (organizer) {
      const actions = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'text-button';
      button.textContent = participant.status === 'registered' ? 'Retirer' : 'Réactiver';
      button.addEventListener('click', () => changeStatus(participant, button));
      actions.append(button); tr.append(actions);
    } else {
      const actions = document.createElement('td');
      if (participant.status === 'registered') {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'text-button';
        button.textContent = completeScores(scores) ? 'Modifier les notes' : 'Évaluer';
        button.addEventListener('click', () => openScores(participant));
        actions.append(button);
      } else actions.textContent = '—';
      tr.append(actions);
    }
    return tr;
  }));
  $('participant-count').textContent = data.participants.length + ' au total';
  renderRanking(data.participants);
  $('participants-empty').hidden = data.participants.length > 0;
  $('login-panel').hidden = true;
  $('workspace').hidden = false;
  $('logout').hidden = false;
}
async function loadParticipants(announce = true) {
  if (!session) return false;
  const current = generation;
  const token = session.accessToken;
  $('refresh').disabled = true;
  try {
    const response = await fetch(baseUrl + '/functions/v1/consulter-participants', {
      headers: { apikey: publicKey, Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (current !== generation || !session) return false;
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        clearSession(); void revoke(token);
        message(data.error || 'Accès refusé. Reconnectez-vous.', true);
        return false;
      }
      throw new Error(data.error || 'La liste des participants est indisponible.');
    }
    if (!data.user || !['organizer', 'jury'].includes(data.user.role) || !Array.isArray(data.participants)) throw new Error('Réponse du serveur invalide.');
    render(data);
    if (announce) message('Liste des participants actualisée.');
    return data;
  } catch (error) {
    if (current !== generation) return false;
    if ($('workspace').hidden) { clearSession(); void revoke(token); }
    message(error instanceof TypeError || error.name === 'TimeoutError' ? 'Connexion interrompue. Réessayez dans un instant.' : error.message, true);
    return false;
  } finally {
    $('refresh').disabled = false;
  }
}
async function changeStatus(participant, button) {
  if (!session || session.role !== 'organizer' || changingStatus) return;
  const nextStatus = participant.status === 'registered' ? 'withdrawn' : 'registered';
  const question = nextStatus === 'withdrawn'
    ? `Retirer ${participant.first_name} ${participant.last_name} du concours ? Les notes seront conservées et la participation sera exclue du classement.`
    : `Réactiver ${participant.first_name} ${participant.last_name} ? Les notes conservées seront de nouveau prises en compte dans le classement.`;
  if (!window.confirm(question)) return;
  const current = generation;
  const token = session.accessToken;
  changingStatus = true;
  button.disabled = true;
  button.textContent = 'Enregistrement…';
  try {
    const response = await fetch(baseUrl + '/functions/v1/changer-statut-participant', {
      method: 'POST', headers: { apikey: publicKey, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: participant.id, status: nextStatus }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (current !== generation || !session) return;
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        clearSession(); void revoke(token);
        message(data.error || 'Accès refusé. Reconnectez-vous.', true); return;
      }
      throw new Error(data.error || 'Le statut n’a pas pu être modifié.');
    }
    if (data.participant_id !== participant.id || data.status !== nextStatus) throw new Error('Réponse inattendue. Actualisez la liste pour vérifier le statut.');
    const refreshed = await loadParticipants(false);
    if (current !== generation || !session) return;
    const stored = refreshed && refreshed.participants.find(row => row.id === participant.id);
    if (stored?.status === nextStatus) {
      message(nextStatus === 'withdrawn'
        ? 'Participation retirée. Les notes sont conservées et le classement est actualisé.'
        : 'Participation réactivée. Les notes sont conservées et le classement est actualisé.');
    } else message('Modification acceptée côté serveur, mais la relecture du statut n’a pas pu être confirmée. Actualisez la liste pour vérifier.', true);
  } catch (error) {
    if (current !== generation || !session) return;
    message(error instanceof TypeError || error instanceof SyntaxError || error.name === 'TimeoutError'
      ? 'La réponse n’a pas pu être reçue. Le statut a peut-être changé. Actualisez la liste pour vérifier avant de réessayer.'
      : error.message, true);
  } finally {
    changingStatus = false;
    button.disabled = false;
    button.textContent = participant.status === 'registered' ? 'Retirer' : 'Réactiver';
  }
}
function openScores(participant) {
  if (!session || session.role !== 'jury' || savingScores || participant.status !== 'registered') return;
  editingParticipant = participant;
  $('score-title').textContent = participant.first_name + ' ' + participant.last_name;
  for (const key of ['taste', 'texture', 'presentation']) $(key).value = completeScores(participant.scores) ? String(participant.scores[key]) : '';
  $('score-error').textContent = '';
  $('score-dialog').showModal();
}
$('cancel-score').addEventListener('click', closeScores);
$('score-dialog').addEventListener('cancel', () => { editingParticipant = null; });
$('score-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!session || session.role !== 'jury' || !editingParticipant || savingScores) return;
  if (!$('score-form').reportValidity()) return;
  const scores = {};
  for (const key of ['taste', 'texture', 'presentation']) scores[key] = $(key).value.trim() === '' ? NaN : Number($(key).value);
  if (!completeScores(scores)) { $('score-error').textContent = 'Saisissez trois notes entières de 0 à 10.'; return; }
  if (!navigator.onLine) { $('score-error').textContent = 'Une connexion Internet est nécessaire pour enregistrer les notes.'; return; }
  const current = generation;
  const token = session.accessToken;
  const participantId = editingParticipant.id;
  savingScores = true;
  $('save-score').disabled = true;
  $('save-score').textContent = 'Enregistrement…';
  $('score-error').textContent = '';
  try {
    const response = await fetch(baseUrl + '/functions/v1/noter-participant', {
      method: 'POST', headers: { apikey: publicKey, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: participantId, ...scores }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (current !== generation || !session) return;
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        clearSession(); void revoke(token);
        message(data.error || 'Accès refusé. Reconnectez-vous.', true); return;
      }
      throw new Error(data.error || 'Les notes n’ont pas pu être enregistrées.');
    }
    if (data.participant_id !== participantId || data.total !== scores.taste + scores.texture + scores.presentation) throw new Error('Réponse inattendue. Actualisez la liste pour vérifier les notes enregistrées.');
    closeScores();
    const refreshed = await loadParticipants(false);
    if (current !== generation || !session) return;
    const stored = refreshed && refreshed.participants.find(participant => participant.id === participantId);
    const verified = completeScores(stored?.scores) && ['taste', 'texture', 'presentation'].every(key => stored.scores[key] === scores[key]);
    message(verified
      ? `Évaluation enregistrée : ${data.total} / 30. Les notes ont été rechargées depuis la base.`
      : `Évaluation enregistrée côté serveur : ${data.total} / 30. La relecture n’a pas pu être confirmée ; utilisez « Actualiser la liste » pour vérifier.`, !verified);
  } catch (error) {
    if (current !== generation || !session) return;
    const text = error instanceof TypeError || error instanceof SyntaxError || error.name === 'TimeoutError'
      ? 'La réponse n’a pas pu être reçue. Les notes ont peut-être été enregistrées. Fermez cette fenêtre et actualisez la liste pour les vérifier.'
      : error.message;
    if ($('score-dialog').open) $('score-error').textContent = text;
    else message(text, true);
  } finally {
    savingScores = false;
    $('save-score').disabled = false;
    $('save-score').textContent = 'Enregistrer les notes';
  }
});
$('login').addEventListener('submit', async event => {
  event.preventDefault();
  if (loginButton.disabled) return;
  if (!$('login').reportValidity()) return;
  const current = ++generation;
  loginButton.disabled = true;
  loginButton.textContent = 'Connexion…';
  message('');
  try {
    const response = await fetch(baseUrl + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { apikey: publicKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: $('login-email').value.trim(), password: $('login-password').value }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    $('login-password').value = '';
    if (current !== generation) return;
    if (!response.ok) throw new Error(response.status === 429 ? 'Trop de tentatives. Patientez avant de réessayer.' : data.code === 'email_not_confirmed' ? 'Votre adresse e-mail doit être confirmée par l’organisation.' : 'Adresse e-mail ou mot de passe incorrect.');
    if (typeof data.access_token !== 'string' || !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new Error('Réponse du service de connexion invalide.');
    session = { accessToken: data.access_token };
    // Jeton conservé uniquement en mémoire ; aucun mot de passe ou jeton en stockage navigateur.
    expiryTimer = setTimeout(() => { clearSession(); message('Votre session a expiré. Reconnectez-vous.', true); }, Math.min(data.expires_in * 1000, 3600000));
    await loadParticipants();
  } catch (error) {
    if (current === generation) {
      clearSession();
      message(error instanceof TypeError || error.name === 'TimeoutError' ? 'Connexion indisponible. Réessayez dans un instant.' : error.message, true);
    }
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Se connecter ↗';
  }
});
$('refresh').addEventListener('click', () => loadParticipants());
$('view-participants').addEventListener('click', () => { if (session) showView('participants'); });
$('view-ranking').addEventListener('click', () => { if (session) showView('ranking'); });
$('logout').addEventListener('click', () => {
  const token = session?.accessToken;
  clearSession();
  message('Vous êtes déconnecté.');
  if (token) void revoke(token);
});
window.addEventListener('pagehide', clearSession);
