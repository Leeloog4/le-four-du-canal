import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/team.js', import.meta.url), 'utf8');
const publicKey = 'sb_publishable_UWnzlp30PvZJbIUS09Z5nQ_oWaT37AM';
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
const participant = { id: 'p', first_name: 'Camille', last_name: 'Martin', email: 'camille@example.test', status: 'registered', created_at: '2026-11-13T12:00:00Z' };
function fixture(fetcher) {
  const elements = new Map();
  function element() {
    return { textContent: '', className: '', hidden: false, disabled: false, value: '', children: [], listeners: {},
      addEventListener(name, fn) { this.listeners[name] = fn; },
      reportValidity() { return true; },
      replaceChildren(...children) { this.children = children; },
      append(child) { this.children.push(child); } };
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
    fetch: fetcher, AbortSignal, Error, TypeError, Date, Intl,
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    window: { addEventListener(name, fn) { windowEvents[name] = fn; } }
  });
  return { $, button, timers, windowEvents, login: () => $('login').listeners.submit({ preventDefault() {} }) };
}
function network(options = {}) {
  const calls = [];
  const fetcher = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes('/auth/v1/token')) return reply(options.authBody || { access_token: 'session-test', expires_in: 3600 }, options.authStatus || 200);
    if (url.includes('/auth/v1/logout')) return reply({});
    if (url.includes('/consulter-participants')) {
      if (options.list) return options.list();
      return reply({ user: { id: 'u', email: 'organisateur@example.test', role: options.role || 'organizer' }, participants: [participant] });
    }
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
  assert.equal(f.$('participants-head').children.length, 3);
  assert.equal(f.$('participants-body').children[0].children.length, 3);
});
