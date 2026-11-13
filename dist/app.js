const form = document.getElementById('registration');
const result = document.getElementById('form-result');
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form));
  if (!values.first_name.trim() || !values.last_name.trim()) {
    result.className = 'notice error';
    result.textContent = 'Renseignez un prénom et un nom pour tester le formulaire.';
  } else {
    result.className = 'notice success';
    result.textContent = 'Le formulaire est correctement rempli. Ceci est un aperçu : aucune inscription n’a été enregistrée et aucun e-mail n’a été envoyé.';
  }
  result.focus();
});
