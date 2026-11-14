import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/app/team.js', import.meta.url), 'utf8');
const publicKey = 'sb_publishable_UWnzlp30PvZJbIUS09Z5nQ_oWaT37AM';
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
const participant = { id: 'p', first_name: 'Camille', last_name: 'Martin', email: 'camille@example.test', status: 'registered', created_at: '2026-11-13T12:00:00Z' };
function fixture(fetcher, { confirm = true } = {}) {
  const elements = new Map();
  function element() {
    return { textContent: '', className: '', hidden: false, disabled: false, value: '', open: false, children: [], listeners: {},
      addEventListener(name, fn) { this.listeners[name] = fn; },
      setAttribute(name, value) { this[name] = value; },
      reportValidity() { return true; },
      replaceChildren(...children) { this.children = children; },
      append(child) { this.children.push(child); },
      showModal() { this.open = true; }, close() { this.open = false; } };
  }
  const $ = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const button = element();
  $('login').querySelector = () => button;
  $('workspace').hidden = true;
  $('logout').hidden = true;
  $('login-email').value = 'organisateur@example.test';
  $('login-password').value = 'mot-de-passe-test';
  const timers = new Map(); let nextTimer = 0;
  const windowEvents = {};
  vm.runInNewContext(source, {
    document: { getElementById: $, createElement: element },
    fetch: fetcher, AbortSignal, Error, TypeError, SyntaxError, Date, Intl, navigator: { onLine: true },
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    window: { addEventListener(name, fn) { windowEvents[name] = fn; }, confirm() { return confirm; } }
  });
  return { $, button, timers, windowEvents, login: () => $('login').listeners.submit({ preventDefault() {} }) };
}
function network(options = {}) {
  const calls = [];
  let savedScores = options.scores || null;
  let currentStatus = options.status || participant.status;
  const fetcher = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes('/auth/v1/token')) return reply(options.authBody || { access_token: 'session-test', expires_in: 3600 }, options.authStatus || 200);
    if (url.includes('/auth/v1/logout')) return reply({});
    if (url.includes('/consulter-participants')) {
      if (options.list) return options.list();
      return reply({ user: { id: 'u', email: 'organisateur@example.test', role: options.role || 'organizer' }, participants: options.participants || [{ ...participant, status: currentStatus, scores: savedScores }] });
    }
    if (url.includes('/noter-participant')) {
      if (options.save) return options.save(init);
      const input = JSON.parse(init.body);
      savedScores = { taste: input.taste, texture: input.texture, presentation: input.presentation };
      return reply({ participant_id: input.participant_id, total: input.taste + input.texture + input.presentation });
    }
    if (url.includes('/changer-statut-participant')) {
      if (options.changeStatus) return options.changeStatus(init);
      const input = JSON.parse(init.body); currentStatus = input.status;
      return reply({ participant_id: input.participant_id, status: currentStatus });
    }
    if (url.includes('/consulter-emails')) return options.emails ? options.emails(init) : reply({ emails: [] });
    if (url.includes('/envoyer-email-test')) return options.emailTest
      ? options.emailTest(init) : reply({ state: 'accepted', message_id: '<message-test>' });
    throw new Error('URL inattendue');
  };
  return { calls, fetcher };
}

test('Connexion équipe : identifiants envoyés uniquement à Supabase et rôle vérifié avant affichage', async () => {
  const n = network(); const f = fixture(n.fetcher);
  await f.login();
  assert.equal(n.calls.length, 2);
  assert.equal(n.calls[0].url, 'https://xeeixhbhfsdxrgeotlix.supabase.co/auth/v1/token?grant_type=password');
  assert.equal(n.calls[0].init.headers.apikey, publicKey);
  assert.equal(JSON.parse(n.calls[0].init.body).password, 'mot-de-passe-test');
  assert.equal(n.calls[1].init.headers.Authorization, 'Bearer session-test');
  assert.equal(f.$('login-password').value, '');
  assert.equal(f.$('workspace').hidden, false);
  assert.equal(f.$('participants-body').children[0].children[1].textContent, participant.email);
  assert.equal(f.button.disabled, false);
  assert.equal(source.includes('localStorage'), false);
  assert.equal(source.includes('sessionStorage'), false);
});
test('Connexion équipe : identifiants incorrects sans affichage de participants', async () => {
  const n = network({ authStatus: 400, authBody: { code: 'invalid_credentials' } }); const f = fixture(n.fetcher);
  await f.login();
  assert.equal(f.$('workspace').hidden, true);
  assert.equal(f.$('login-password').value, '');
  assert.match(f.$('team-message').textContent, /incorrect/);
  assert.equal(n.calls.length, 1);
});
test('Connexion équipe : compte connecté sans rôle et session invalide refusés', async () => {
  for (const status of [401, 403]) {
    const n = network({ list: () => reply({ error: 'Accès refusé' }, status) }); const f = fixture(n.fetcher);
    await f.login();
    assert.equal(f.$('workspace').hidden, true);
    assert.equal(f.$('participants-body').children.length, 0);
    assert.equal(f.$('team-message').textContent, 'Accès refusé');
  }
});
test('Connexion équipe : déconnexion efface le jeton mémoire et les données affichées', async () => {
  const n = network(); const f = fixture(n.fetcher);
  await f.login();
  f.$('logout').listeners.click();
  assert.equal(f.$('workspace').hidden, true);
  assert.equal(f.$('participants-body').children.length, 0);
  assert.equal(f.timers.size, 0);
  assert.match(n.calls.at(-1).url, /logout\?scope=local/);
  assert.equal(n.calls.at(-1).init.headers.Authorization, 'Bearer session-test');
});
test('Connexion équipe : expiration et sortie de page effacent la liste', async () => {
  for (const kind of ['timer', 'pagehide']) {
    const n = network(); const f = fixture(n.fetcher);
    await f.login();
    if (kind === 'timer') [...f.timers.values()][0](); else f.windowEvents.pagehide();
    assert.equal(f.$('workspace').hidden, true);
    assert.equal(f.$('participants-body').children.length, 0);
  }
});
test('Connexion équipe : réponse tardive après déconnexion ne réaffiche pas les données', async () => {
  let finish;
  const n = network({ list: () => new Promise(resolve => { finish = resolve; }) });
  const f = fixture(n.fetcher);
  const pending = f.login();
  while (!finish) await new Promise(resolve => setImmediate(resolve));
  f.$('logout').listeners.click();
  finish(reply({ user: { role: 'organizer', email: 'test' }, participants: [participant] }));
  await pending;
  assert.equal(f.$('workspace').hidden, true);
  assert.equal(f.$('participants-body').children.length, 0);
});
test('Connexion équipe : vue jury sans colonne de coordonnées', async () => {
  const n = network({ role: 'jury' }); const f = fixture(n.fetcher);
  await f.login();
  assert.equal(f.$('participants-head').children.length, 5);
  assert.equal(f.$('participants-body').children[0].children.length, 5);
});

function evaluate(f, values = { taste: '8', texture: '9', presentation: '7' }) {
  const row = f.$('participants-body').children[0];
  row.children.at(-1).children[0].listeners.click();
  for (const [key, value] of Object.entries(values)) f.$(key).value = value;
  return f.$('score-form').listeners.submit({ preventDefault() {} });
}
test('Notation PWA : saisie jury, total 24 et relecture des notes après enregistrement', async () => {
  const n = network({ role: 'jury' }); const f = fixture(n.fetcher);
  await f.login(); await evaluate(f);
  const call = n.calls.find(call => call.url.includes('/noter-participant'));
  assert.equal(call.init.headers.Authorization, 'Bearer session-test');
  assert.deepEqual(JSON.parse(call.init.body), { participant_id: participant.id, taste: 8, texture: 9, presentation: 7 });
  assert.match(f.$('team-message').textContent, /24 \/ 30/);
  assert.match(f.$('team-message').textContent, /rechargées depuis la base/);
  assert.match(f.$('participants-body').children[0].children[3].textContent, /24 \/ 30/);
  assert.equal(f.$('score-dialog').open, false);
});
test('Notation PWA : notes existantes préremplies, zéro conservé et modification rechargée', async () => {
  const n = network({ role: 'jury', scores: { taste: 0, texture: 10, presentation: 8 } }); const f = fixture(n.fetcher);
  await f.login();
  f.$('participants-body').children[0].children.at(-1).children[0].listeners.click();
  assert.equal(f.$('taste').value, '0'); assert.equal(f.$('texture').value, '10');
  f.$('presentation').value = '7';
  await f.$('score-form').listeners.submit({ preventDefault() {} });
  await f.$('refresh').listeners.click();
  assert.match(f.$('participants-body').children[0].children[3].textContent, /17 \/ 30/);
});
test('Notation PWA : organisateur en lecture, participation retirée absente pour le jury', async () => {
  const org = fixture(network({ scores: { taste: 8, texture: 9, presentation: 7 } }).fetcher);
  await org.login();
  const row = org.$('participants-body').children[0];
  assert.equal(row.children.length, 6);
  assert.equal(row.children.at(-1).children[0].textContent, 'Retirer');
  assert.match(row.children[4].textContent, /24 \/ 30/);
  assert.equal(row.children.flatMap(cell => cell.children).some(button => /Évaluer|Modifier les notes/.test(button.textContent)), false);
  const withdrawn = fixture(network({ role: 'jury', status: 'withdrawn' }).fetcher);
  await withdrawn.login();
  assert.equal(withdrawn.$('participants-body').children.length, 0);
  assert.equal(withdrawn.$('participant-count').textContent, '0 au total');
  assert.equal(withdrawn.$('participants-empty').hidden, false);
});
test('Notation PWA : notes vides, fractions ou hors barème refusées avant envoi', async () => {
  for (const value of ['', '-1', '11', '2.5']) {
    const n = network({ role: 'jury' }); const f = fixture(n.fetcher);
    await f.login(); await evaluate(f, { taste: value, texture: '9', presentation: '7' });
    assert.match(f.$('score-error').textContent, /trois notes entières/);
    assert.equal(n.calls.some(call => call.url.includes('/noter-participant')), false);
  }
});
test('Notation PWA : échec réseau sans faux succès et relecture non confirmée signalée', async () => {
  const n = network({ role: 'jury', save: () => { throw new TypeError('network'); } }); const f = fixture(n.fetcher);
  await f.login(); await evaluate(f);
  assert.match(f.$('score-error').textContent, /peut-être été enregistrées/);
  assert.equal(f.$('score-dialog').open, true);
  assert.equal(f.$('save-score').disabled, false);
  const noReadback = network({ role: 'jury', save: () => reply({ participant_id: participant.id, total: 24 }) });
  const other = fixture(noReadback.fetcher); await other.login(); await evaluate(other);
  assert.match(other.$('team-message').textContent, /relecture n’a pas pu être confirmée/);
});
test('Notation PWA : double clic et déconnexion pendant l’enregistrement', async () => {
  let complete;
  const n = network({ role: 'jury', save: () => new Promise(resolve => { complete = resolve; }) });
  const f = fixture(n.fetcher); await f.login();
  const pending = evaluate(f);
  await f.$('score-form').listeners.submit({ preventDefault() {} });
  assert.equal(n.calls.filter(call => call.url.includes('/noter-participant')).length, 1);
  f.$('logout').listeners.click();
  assert.equal(f.$('score-dialog').open, false);
  assert.equal(f.$('taste').value, '');
  complete(reply({ participant_id: participant.id, total: 24 })); await pending;
  assert.equal(f.$('workspace').hidden, true);
  assert.equal(f.$('participants-body').children.length, 0);
});

test('Classement PWA : tri, somme et rangs 1/1/3 sans départage des égalités', async () => {
  const participants = [
    { ...participant, id: 'low', first_name: 'Alex', scores: { taste: 6, texture: 6, presentation: 6 } },
    { ...participant, id: 'high1', first_name: 'Camille', scores: { taste: 8, texture: 9, presentation: 7 } },
    { ...participant, id: 'high2', first_name: 'Lou', scores: { taste: 10, texture: 6, presentation: 8 } }
  ];
  const f = fixture(network({ participants }).fetcher); await f.login();
  const rows = f.$('ranking-body').children;
  assert.deepEqual(rows.map(row => row.children[0].textContent), ['1 ex æquo', '1 ex æquo', '3']);
  assert.deepEqual(rows.map(row => row.children[5].textContent), ['24 / 30', '24 / 30', '18 / 30']);
  assert.equal(rows[2].children[1].textContent, 'Alex Martin');
});
test('Classement PWA : non-évalués et retirés exclus, total zéro admis', async () => {
  const participants = [
    { ...participant, id: 'none', scores: null },
    { ...participant, id: 'withdrawn', status: 'withdrawn', scores: { taste: 10, texture: 10, presentation: 10 } },
    { ...participant, id: 'partial', scores: { taste: 5 } },
    { ...participant, id: 'zero', scores: { taste: 0, texture: 0, presentation: 0 } }
  ];
  const f = fixture(network({ participants }).fetcher); await f.login();
  const rows = f.$('ranking-body').children;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].children[0].textContent, '1');
  assert.equal(rows[0].children[5].textContent, '0 / 30');
});
test('Classement PWA : deux rôles autorisés, aucune coordonnée affichée et vues utilisables', async () => {
  for (const role of ['organizer', 'jury']) {
    const f = fixture(network({ role, scores: { taste: 8, texture: 9, presentation: 7 } }).fetcher);
    await f.login();
    f.$('view-ranking').listeners.click();
    assert.equal(f.$('ranking-panel').hidden, false);
    assert.equal(f.$('participants-panel').hidden, true);
    assert.equal(f.$('view-ranking')['aria-pressed'], 'true');
    const text = f.$('ranking-body').children.flatMap(row => row.children.map(cell => cell.textContent)).join(' ');
    assert.equal(text.includes('@'), false);
    f.$('view-participants').listeners.click();
    assert.equal(f.$('ranking-panel').hidden, true);
  }
});
test('Classement PWA : recalcul après notation et effacement à la déconnexion', async () => {
  const f = fixture(network({ role: 'jury' }).fetcher); await f.login();
  assert.equal(f.$('ranking-empty').hidden, false);
  assert.equal(f.$('ranking-body').children.length, 0);
  await evaluate(f);
  assert.equal(f.$('ranking-empty').hidden, true);
  assert.equal(f.$('ranking-body').children[0].children[5].textContent, '24 / 30');
  f.$('view-ranking').listeners.click();
  f.$('logout').listeners.click();
  assert.equal(f.$('ranking-body').children.length, 0);
  assert.equal(f.$('ranking-count').textContent, '');
  assert.equal(f.$('workspace').hidden, true);
  assert.equal(f.$('ranking-panel').hidden, true);
});

function changeParticipantStatus(f) {
  return f.$('participants-body').children[0].children.at(-1).children[0].listeners.click();
}
test('Gestion PWA : retrait puis réactivation, notes conservées et classement recalculé', async () => {
  const n = network({ scores: { taste: 8, texture: 9, presentation: 7 } }); const f = fixture(n.fetcher);
  await f.login(); await changeParticipantStatus(f);
  assert.match(f.$('team-message').textContent, /Participation retirée/);
  assert.equal(f.$('participants-body').children[0].children[2].textContent, 'Retiré');
  assert.match(f.$('participants-body').children[0].children[4].textContent, /24 \/ 30/);
  assert.equal(f.$('ranking-body').children.length, 0);
  assert.equal(f.$('participants-body').children[0].children.at(-1).children[0].textContent, 'Réactiver');
  const call = n.calls.find(c => c.url.includes('/changer-statut-participant'));
  assert.equal(call.init.headers.Authorization, 'Bearer session-test');
  assert.deepEqual(JSON.parse(call.init.body), { participant_id: participant.id, status: 'withdrawn' });
  await changeParticipantStatus(f);
  assert.match(f.$('team-message').textContent, /Participation réactivée/);
  assert.equal(f.$('participants-body').children[0].children[2].textContent, 'Inscrit');
  assert.equal(f.$('ranking-body').children[0].children[5].textContent, '24 / 30');
});
test('Gestion PWA : annulation de confirmation sans requête ou changement', async () => {
  const n = network(); const f = fixture(n.fetcher, { confirm: false });
  await f.login(); await changeParticipantStatus(f);
  assert.equal(n.calls.some(c => c.url.includes('/changer-statut-participant')), false);
  assert.equal(f.$('participants-body').children[0].children[2].textContent, 'Inscrit');
});
test('Gestion PWA : aucun bouton de gestion du statut dans la vue jury', async () => {
  const f = fixture(network({ role: 'jury' }).fetcher); await f.login();
  const button = f.$('participants-body').children[0].children.at(-1).children[0];
  assert.equal(button.textContent, 'Évaluer');
  assert.equal(/Retirer|Réactiver/.test(button.textContent), false);
});
test('Gestion PWA : erreur réseau sans changement optimiste et bouton rétabli', async () => {
  const n = network({ changeStatus: () => { throw new TypeError('network'); } }); const f = fixture(n.fetcher);
  await f.login(); await changeParticipantStatus(f);
  assert.match(f.$('team-message').textContent, /peut-être changé/);
  assert.equal(f.$('participants-body').children[0].children[2].textContent, 'Inscrit');
  assert.equal(f.$('participants-body').children[0].children.at(-1).children[0].disabled, false);
});
test('Gestion PWA : relecture incohérente signalée, aucune fausse confirmation', async () => {
  const n = network({ changeStatus: () => reply({ participant_id: participant.id, status: 'withdrawn' }) }); const f = fixture(n.fetcher);
  await f.login(); await changeParticipantStatus(f);
  assert.match(f.$('team-message').textContent, /relecture du statut n’a pas pu être confirmée/);
  assert.equal(f.$('team-message').className, 'notice error');
});
test('Gestion PWA : double clic puis déconnexion, aucun retour tardif de données', async () => {
  let complete;
  const n = network({ changeStatus: () => new Promise(resolve => { complete = resolve; }) }); const f = fixture(n.fetcher);
  await f.login();
  const pending = changeParticipantStatus(f);
  await changeParticipantStatus(f);
  assert.equal(n.calls.filter(c => c.url.includes('/changer-statut-participant')).length, 1);
  f.$('logout').listeners.click();
  complete(reply({ participant_id: participant.id, status: 'withdrawn' })); await pending;
  assert.equal(f.$('workspace').hidden, true);
  assert.equal(f.$('participants-body').children.length, 0);
  assert.equal(f.$('ranking-body').children.length, 0);
});

test('E-mail PWA : aucun envoi automatique, vue organisateur et clic explicite confirmé', async () => {
  const n = network(); const f = fixture(n.fetcher); await f.login();
  assert.equal(n.calls.some(c => c.url.includes('/envoyer-email-test')), false);
  assert.equal(f.$('view-emails').hidden, false);
  f.$('view-emails').listeners.click(); assert.equal(f.$('emails-panel').hidden, false);
  await f.$('send-email-test').listeners.click();
  const call = n.calls.find(c => c.url.includes('/envoyer-email-test'));
  assert.equal(call.init.headers.Authorization, 'Bearer session-test');
  assert.deepEqual(JSON.parse(call.init.body), {});
  assert.match(f.$('email-test-result').textContent, /Brevo a accepté/);
  assert.match(f.$('email-test-result').textContent, /réception reste à confirmer/);
  assert.equal(f.$('send-email-test').disabled, true);
  await f.$('send-email-test').listeners.click();
  assert.equal(n.calls.filter(c => c.url.includes('/envoyer-email-test')).length, 1);
});
test('E-mail PWA : jury et annulation sans envoi', async () => {
  const n = network({ role: 'jury' }); const f = fixture(n.fetcher); await f.login();
  assert.equal(f.$('view-emails').hidden, true);
  await f.$('send-email-test').listeners.click();
  assert.equal(n.calls.some(c => c.url.includes('/envoyer-email-test')), false);
  const other = network(); const cancelled = fixture(other.fetcher, { confirm: false }); await cancelled.login();
  await cancelled.$('send-email-test').listeners.click();
  assert.equal(other.calls.some(c => c.url.includes('/envoyer-email-test')), false);
});
test('E-mail PWA : résultat incertain sans renvoi, refus explicite affiché', async () => {
  for (const mode of ['network', 'uncertain', 'failed']) {
    const n = network({ emailTest: () => {
      if (mode === 'network') throw new TypeError('network');
      return reply({ state: mode, error: 'Résultat à vérifier' }, 502);
    } });
    const f = fixture(n.fetcher); await f.login(); await f.$('send-email-test').listeners.click();
    assert.equal(f.$('email-test-result').className, 'notice error');
    assert.equal(f.$('send-email-test').disabled, mode !== 'failed');
    assert.equal(n.calls.filter(c => c.url.includes('/envoyer-email-test')).length, 1);
  }
});
test('E-mail PWA : double clic puis déconnexion pendant l’envoi sans retour tardif', async () => {
  let complete;
  const n = network({ emailTest: () => new Promise(resolve => { complete = resolve; }) }); const f = fixture(n.fetcher);
  await f.login(); const pending = f.$('send-email-test').listeners.click();
  await f.$('send-email-test').listeners.click();
  assert.equal(n.calls.filter(c => c.url.includes('/envoyer-email-test')).length, 1);
  f.$('logout').listeners.click();
  complete(reply({ state: 'accepted', message_id: '<message-test>' })); await pending;
  assert.equal(f.$('workspace').hidden, true);
  assert.equal(f.$('email-test-result').textContent, '');
  assert.equal(f.$('view-emails').hidden, true);
});


const historyRow = { id: 'job', recipient: 'camille@example.test', kind: 'reminder', state: 'simulated', due_at: '2026-12-03T14:00:00Z',
  attempts: 1, message_id: null, processed_at: '2026-11-14T15:37:00Z', last_error: 'Adresse fictive',
  subject: '<img src=x onerror=alert(1)>', content: '<script>secret</script>', participant: { first_name: 'Camille', last_name: 'Martin', status: 'withdrawn' } };
test('Historique UI : lecture sur demande organisateur, destinataire et contenu en texte brut', async () => {
  const n = network({ emails: () => reply({ emails: [historyRow] }) }); const f = fixture(n.fetcher); await f.login();
  assert.equal(n.calls.some(call => call.url.includes('consulter-emails')), false);
  await f.$('view-emails').listeners.click();
  const cells = f.$('emails-body').children[0].children;
  assert.equal(cells[0].textContent, 'Camille Martin (retiré)'); assert.equal(cells[1].textContent, historyRow.recipient);
  assert.match(cells[3].textContent, /Simulé/); assert.match(cells[4].textContent, /15:00/);
  const details = cells[5].children[0]; assert.equal(details.children[1].textContent, historyRow.subject); assert.equal(details.children[2].textContent, historyRow.content);
  const call = n.calls.find(call => call.url.includes('consulter-emails')); assert.equal(call.init.headers.Authorization, 'Bearer session-test'); assert.equal(call.init.method, undefined);
  assert.equal(f.$('refresh-emails').disabled, false); assert.equal(n.calls.some(call => call.url.includes('envoyer-email-test')), false);
});
test('Historique UI : jury ne charge aucun message même via événement forcé', async () => {
  const n = network({ role: 'jury' }); const f = fixture(n.fetcher); await f.login();
  await f.$('view-emails').listeners.click(); await f.$('refresh-emails').listeners.click();
  assert.equal(n.calls.length, 2); assert.equal(f.$('view-emails').hidden, true);
});
test('Historique UI : états acceptation, incertitude et inconnu explicités sans prétendre livraison', async () => {
  const emails = ['accepted', 'uncertain', 'pending', 'processing', 'failed', 'skipped', 'inconnu'].map(state => ({ ...historyRow, state }));
  const n = network({ emails: () => reply({ emails }) }); const f = fixture(n.fetcher); await f.login(); await f.$('view-emails').listeners.click();
  const states = f.$('emails-body').children.map(row => row.children[3].textContent);
  assert.equal(states[0], 'Accepté par Brevo'); assert.match(states[1], /incertain/); assert.match(states.at(-1), /inconnu/);
});
test('Historique UI : vide distinct d’erreur, actualisation efface les résultats périmés', async () => {
  let mode = 'normal'; const n = network({ emails: () => mode === 'error' ? reply({ error: 'Indisponible' }, 503) : reply({ emails: mode === 'empty' ? [] : [historyRow] }) });
  const f = fixture(n.fetcher); await f.login(); await f.$('view-emails').listeners.click();
  mode = 'error'; await f.$('refresh-emails').listeners.click();
  assert.equal(f.$('emails-body').children.length, 0); assert.equal(f.$('emails-empty').hidden, true); assert.match(f.$('emails-message').textContent, /Indisponible/);
  mode = 'empty'; await f.$('refresh-emails').listeners.click(); assert.equal(f.$('emails-empty').hidden, false);
});
test('Historique UI : expiration serveur efface session et historique', async () => {
  const n = network({ emails: () => reply({ error: 'Session expirée' }, 401) }); const f = fixture(n.fetcher); await f.login();
  await f.$('view-emails').listeners.click(); assert.equal(f.$('workspace').hidden, true); assert.equal(f.$('emails-body').children.length, 0);
});
test('Historique UI : requête tardive après déconnexion ignorée, sans double chargement', async () => {
  let finish; const n = network({ emails: () => new Promise(resolve => { finish = resolve; }) }); const f = fixture(n.fetcher); await f.login();
  const pending = f.$('view-emails').listeners.click(); await f.$('view-emails').listeners.click();
  assert.equal(n.calls.filter(call => call.url.includes('consulter-emails')).length, 1);
  f.$('logout').listeners.click(); finish(reply({ emails: [historyRow] })); await pending;
  assert.equal(f.$('emails-body').children.length, 0); assert.equal(f.$('emails-message').textContent, '');
});
test('Historique UI : déconnexion et sortie de page effacent les détails des e-mails', async () => {
  for (const kind of ['logout', 'pagehide']) {
    const n = network({ emails: () => reply({ emails: [historyRow] }) }); const f = fixture(n.fetcher); await f.login(); await f.$('view-emails').listeners.click();
    if (kind === 'logout') f.$('logout').listeners.click(); else f.windowEvents.pagehide();
    assert.equal(f.$('emails-body').children.length, 0); assert.equal(f.$('emails-count').textContent, '');
  }
});


test('Participants jury : retrait invisible puis réactivation visible après actualisation', async () => {
  const rows = [{ ...participant }, { ...participant, id: 'retire', first_name: 'Alex', status: 'withdrawn' }];
  const n = network({ role: 'jury', participants: rows }); const f = fixture(n.fetcher); await f.login();
  assert.equal(f.$('participants-body').children.length, 1); assert.equal(f.$('participant-count').textContent, '1 au total');
  rows[1].status = 'registered'; await f.$('refresh').listeners.click();
  assert.equal(f.$('participants-body').children.length, 2); assert.equal(f.$('participant-count').textContent, '2 au total');
});
test('Participants organisateur : retiré conservé avec action Réactiver', async () => {
  const f = fixture(network({ status: 'withdrawn' }).fetcher); await f.login();
  const row = f.$('participants-body').children[0]; assert.equal(row.children[2].textContent, 'Retiré');
  assert.equal(row.children.at(-1).children[0].textContent, 'Réactiver');
});
