const form = document.getElementById('registration');
const result = document.getElementById('form-result');
const button = form.querySelector('button[type="submit"]');
const endpoint = 'https://xeeixhbhfsdxrgeotlix.supabase.co/functions/v1/inscrire-participant';
let submitting = false;

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
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'L’inscription n’a pas pu être enregistrée.');
    if (typeof data.reference !== 'string' || !data.reference) throw new Error('Réponse inattendue. Vérifiez votre inscription auprès de l’organisation avant de réessayer.');
    result.className = 'notice success';
    result.textContent = 'Votre participation est enregistrée. Référence : ' + data.reference.slice(0, 8).toUpperCase() + '. Aucun e-mail n’a été envoyé : cette fonction n’est pas encore activée.';
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
