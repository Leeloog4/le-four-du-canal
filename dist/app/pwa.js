const installButton = document.getElementById('install-app');
const status = document.getElementById('installation-message');
const network = document.getElementById('network-message');
let installPrompt;

function connectionStatus() { network.hidden = navigator.onLine; }
connectionStatus();
window.addEventListener('online', connectionStatus);
window.addEventListener('offline', connectionStatus);

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  installButton.disabled = true;
  try {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    status.textContent = choice.outcome === 'accepted'
      ? 'Installation demandée au navigateur.' : 'Vous pouvez continuer à utiliser l’application dans ce navigateur.';
  } catch {
    status.textContent = 'Utilisez l’option d’ajout à l’écran d’accueil dans le menu de votre navigateur.';
  } finally {
    installPrompt = null;
    installButton.hidden = true;
    installButton.disabled = false;
  }
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
  status.textContent = 'Application installée.';
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {
    status.textContent = 'L’application reste accessible dans le navigateur. L’installation n’a pas pu être préparée.';
  });
}
