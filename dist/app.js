const form = document.getElementById('registration');
const result = document.getElementById('form-result');
const button = form.querySelector('button[type="submit"]');
const endpoint = 'https://xeeixhbhfsdxrgeotlix.supabase.co/functions/v1/inscrire-participant';
let submitting = false;
const emailStates = {
  not_configured: 'Aucun e-mail n’a été envoyé : cette fonction n’est pas encore activée.',
  simulated: 'Confirmation simulée pour cette adresse fictive : aucun e-mail envoyé.',
  accepted: 'Brevo a accepté la demande d’e-mail de confirmation. Vérifiez votre boîte de réception et les indésirables ; la livraison reste à vérifier.',
  pending: 'L’e-mail de confirmation est en attente de traitement.',
  processing: 'L’e-mail de confirmation est en cours de traitement.',
  failed: 'L’envoi de la confirmation a échoué. Votre inscription reste enregistrée.',
  uncertain: 'Le résultat de l’envoi de la confirmation reste à vérifier. Votre inscription est conservée.',
  skipped: 'La confirmation n’a pas été envoyée : son traitement a été annulé.'
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  result.textContent = '';
  result.className = '';
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form));
  if (!values.first_name.trim() || !values.last_name.trim()) {
    result.className = 'notice error';
    result.textContent = 'Renseignez votre prénom et votre nom.';
    result.focus();
    return;
  }
  submitting = true;
  button.disabled = true;
  button.textContent = 'Enregistrement…';
  form.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
      signal: AbortSignal.timeout(45000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'L’inscription n’a pas pu être enregistrée.');
    if (typeof data.reference !== 'string' || !data.reference) throw new Error('Réponse inattendue. Vérifiez votre inscription auprès de l’organisation avant de réessayer.');
    result.className = 'notice success';
    result.textContent = 'Votre participation est enregistrée. Référence : ' + data.reference.slice(0, 8).toUpperCase() + '. ' + (emailStates[data.email_state] || 'Le statut de la confirmation n’est pas disponible pour le moment.');
    form.reset();
  } catch (error) {
    result.className = 'notice error';
    result.textContent = error instanceof TypeError || error.name === 'TimeoutError' || error.name === 'AbortError' || error instanceof SyntaxError
      ? 'La réponse n’a pas pu être reçue. L’inscription a peut-être été enregistrée. Réessayez avec la même adresse pour éviter un doublon.'
      : error.message;
  } finally {
    submitting = false;
    button.disabled = false;
    button.textContent = 'Enregistrer ma participation ↗';
    form.removeAttribute('aria-busy');
    result.focus();
  }
});
