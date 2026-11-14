const form = document.querySelector('#registration');
const result = document.querySelector('#form-result');
const button = form.querySelector('button');
const mailStates = {
  simulated: 'E-mail de confirmation simulé : aucun message n’a été envoyé.',
  accepted: 'La demande d’e-mail a été acceptée par Brevo. Sa livraison reste à vérifier.',
  failed: 'L’e-mail de confirmation n’a pas pu être envoyé. Votre inscription est bien enregistrée.',
  uncertain: 'Le résultat de l’envoi est incertain. Votre inscription est bien enregistrée.',
  pending: 'L’e-mail de confirmation est en attente de traitement.',
  processing: 'La demande d’e-mail est en cours de traitement.'
};
try {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error();
  const cfg = await response.json();
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(cfg.event_at));
  document.querySelector('#event-date').textContent = date + ' · Paris';
  document.querySelector('#event-place').textContent = cfg.place;
  document.querySelector('#demo-banner').textContent = `${cfg.demo ? 'PROTOTYPE D’ÉTUDE · Date fictive' : 'LE CONCOURS DU FOUR DU CANAL'} · ${cfg.email_mode === 'simulated' ? 'E-mails simulés, aucun envoi' : 'E-mails via Brevo'}`;
  if (!cfg.demo) document.querySelector('#date-note').textContent = 'Horaire indiqué dans le fuseau Europe/Paris.';
} catch { document.querySelector('#event-date').textContent = 'Informations momentanément indisponibles'; }

form.addEventListener('submit', async event => {
  event.preventDefault();
  result.textContent = '';
  for (const field of ['first_name', 'last_name', 'email']) {
    document.getElementById(field + '-error').textContent = '';
    document.getElementById(field).removeAttribute('aria-invalid');
  }
  if (!form.reportValidity()) return;
  button.disabled = true;
  button.textContent = 'Enregistrement…';
  try {
    const response = await fetch('/api/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const data = await response.json();
    if (!response.ok) {
      for (const [field, message] of Object.entries(data.fields || {})) {
        const input = document.getElementById(field);
        if (input) { input.setAttribute('aria-invalid', 'true'); document.getElementById(field + '-error').textContent = message; }
      }
      throw new Error(data.error || 'Enregistrement impossible.');
    }
    result.className = 'notice success';
    result.textContent = `Votre participation est enregistrée. Référence : ${data.reference.slice(0, 8).toUpperCase()}. ${mailStates[data.email_state] || mailStates.pending}`;
    form.reset();
  } catch (error) { result.className = 'notice error'; result.textContent = error.message === 'Failed to fetch' ? 'Connexion interrompue. L’inscription a peut-être été enregistrée ; réessayez avec la même adresse pour éviter un doublon.' : error.message; }
  finally { button.disabled = false; button.textContent = 'Enregistrer ma participation ↗'; result.focus(); }
});
