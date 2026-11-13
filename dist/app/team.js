const baseUrl = 'https://xeeixhbhfsdxrgeotlix.supabase.co';
const publicKey = 'sb_publishable_UWnzlp30PvZJbIUS09Z5nQ_oWaT37AM';
const $ = id => document.getElementById(id);
const loginButton = $('login').querySelector('button[type="submit"]');
let session = null, expiryTimer, generation = 0;

function message(text, error = false) {
  $('team-message').textContent = text;
  $('team-message').className = text ? 'notice ' + (error ? 'error' : 'success') : '';
}
function clearSession() {
  generation++;
  session = null;
  clearTimeout(expiryTimer);
  $('workspace').hidden = true;
  $('login-panel').hidden = false;
  $('logout').hidden = true;
  $('participants-head').replaceChildren();
  $('participants-body').replaceChildren();
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
  $('identity').textContent = data.user.email + ' · ' + (organizer ? 'Organisateur' : 'Jury');
  $('participant-help').textContent = organizer
    ? 'Les inscriptions reçues depuis le formulaire du concours.'
    : 'Les coordonnées des participants sont réservées à l’organisateur.';
  $('participants-head').replaceChildren(...['Participant', ...(organizer ? ['E-mail'] : []), 'Statut', 'Inscription (Paris)'].map(value => {
    const th = document.createElement('th'); th.textContent = value; th.scope = 'col'; return th;
  }));
  $('participants-body').replaceChildren(...data.participants.map(participant => {
    const tr = document.createElement('tr');
    const createdAt = new Date(participant.created_at);
    const date = Number.isNaN(createdAt.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(createdAt);
    for (const value of [participant.first_name + ' ' + participant.last_name, ...(organizer ? [participant.email] : []), participant.status === 'registered' ? 'Inscrit' : 'Retiré', date]) {
      const td = document.createElement('td'); td.textContent = value; tr.append(td);
    }
    return tr;
  }));
  $('participant-count').textContent = data.participants.length + ' au total';
  $('participants-empty').hidden = data.participants.length > 0;
  $('login-panel').hidden = true;
  $('workspace').hidden = false;
  $('logout').hidden = false;
}
async function loadParticipants() {
  if (!session) return;
  const current = generation;
  const token = session.accessToken;
  $('refresh').disabled = true;
  try {
    const response = await fetch(baseUrl + '/functions/v1/consulter-participants', {
      headers: { apikey: publicKey, Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (current !== generation || !session) return;
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        clearSession(); void revoke(token);
        message(data.error || 'Accès refusé. Reconnectez-vous.', true);
        return;
      }
      throw new Error(data.error || 'La liste des participants est indisponible.');
    }
    if (!data.user || !['organizer', 'jury'].includes(data.user.role) || !Array.isArray(data.participants)) throw new Error('Réponse du serveur invalide.');
    render(data);
    message('Liste des participants actualisée.');
  } catch (error) {
    if (current !== generation) return;
    if ($('workspace').hidden) { clearSession(); void revoke(token); }
    message(error instanceof TypeError || error.name === 'TimeoutError' ? 'Connexion interrompue. Réessayez dans un instant.' : error.message, true);
  } finally {
    $('refresh').disabled = false;
  }
}
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
$('refresh').addEventListener('click', loadParticipants);
$('logout').addEventListener('click', () => {
  const token = session?.accessToken;
  clearSession();
  message('Vous êtes déconnecté.');
  if (token) void revoke(token);
});
window.addEventListener('pagehide', clearSession);
