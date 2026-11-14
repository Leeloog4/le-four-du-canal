import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../src/config.mjs';
import { createStore } from '../src/store.mjs';
import { createApp } from '../src/app.mjs';
import { emailJobs } from '../src/domain.mjs';
import { processEmails } from '../src/emails.mjs';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'canal-test-'));
  const cfg = config({ DATABASE_PATH: join(dir, 'test.sqlite'), EVENT_AT: '2099-12-04T14:00:00Z', CRON_SECRET: 'test-cron-secret-uniquement' });
  const store = await createStore(cfg);
  const server = createServer(createApp(store, cfg));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, { method = 'GET', body, cookie, origin = cfg.origin, authorization } = {}) => {
    const headers = { 'Content-Type': 'application/json', Origin: origin };
    if (cookie) headers.Cookie = cookie;
    if (authorization) headers.Authorization = authorization;
    const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = (response.headers.get('content-type') || '').includes('json') ? await response.json() : await response.text();
    return { status: response.status, data, headers: response.headers };
  };
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); await rm(dir, { recursive: true, force: true }); });
  return { cfg, store, request };
}
const fields = { first_name: 'Camille', last_name: 'Martin', email: 'camille@example.test' };
const password = 'Test-local-seulement-1234';
async function login(store, request, role) {
  const email = role + '@example.test'; await store.createUser(email, password, role);
  const result = await request('/api/login', { method: 'POST', body: { email, password } });
  assert.equal(result.status, 200);
  return result.headers.get('set-cookie').split(';')[0];
}

test('Parcours complet : inscription, lecture organisateur, notation jury, classement, retrait', async t => {
  const { store, request } = await fixture(t);
  const registration = await request('/api/registrations', { method: 'POST', body: fields });
  assert.equal(registration.status, 201); assert.equal(registration.data.email_state, 'simulated');
  const id = registration.data.reference;
  const org = await login(store, request, 'organizer'); const jury = await login(store, request, 'jury');
  const rows = await request('/api/participants', { cookie: org });
  assert.equal(rows.data.participants[0].email, fields.email);
  assert.equal(rows.data.participants[0].id, id);
  const juryRows = await request('/api/participants', { cookie: jury });
  assert.equal('email' in juryRows.data.participants[0], false);
  const notes = { taste: 8, texture: 9, presentation: 7 };
  assert.equal((await request('/api/scores/' + id, { method: 'PUT', cookie: jury, body: notes })).status, 200);
  const ranked = await request('/api/ranking', { cookie: org }); assert.equal(ranked.data.ranking[0].total, 24);
  assert.equal((await request('/api/participants/' + id, { method: 'PATCH', cookie: org, body: { status: 'withdrawn' } })).status, 200);
  assert.equal((await request('/api/ranking', { cookie: org })).data.ranking.length, 0);
  assert.equal((await request('/api/scores/' + id, { method: 'PUT', cookie: jury, body: notes })).status, 409);
  const jobs = (await request('/api/emails', { cookie: org })).data.emails;
  assert.equal(jobs.find(j => j.kind === 'reminder').state, 'skipped');
});
test('Inscription : erreurs utiles, doublon normalisé et absence de lignes superflues', async t => {
  const { store, request } = await fixture(t);
  const invalid = await request('/api/registrations', { method: 'POST', body: { ...fields, email: 'invalide' } });
  assert.equal(invalid.status, 422); assert.ok(invalid.data.fields.email);
  assert.equal((await store.listParticipants()).length, 0);
  assert.equal((await request('/api/registrations', { method: 'POST', body: fields })).status, 201);
  assert.equal((await request('/api/registrations', { method: 'POST', body: { ...fields, email: ' CAMILLE@EXAMPLE.TEST ' } })).status, 409);
  assert.equal((await store.listParticipants()).length, 1); assert.equal((await store.listEmails()).length, 2);
});
test('Droits : anonyme, organisateur et jury refusés hors de leur périmètre', async t => {
  const { store, request } = await fixture(t);
  for (const path of ['/api/participants', '/api/ranking', '/api/emails']) assert.equal((await request(path)).status, 401);
  const org = await login(store, request, 'organizer'); const jury = await login(store, request, 'jury');
  const id = (await request('/api/registrations', { method: 'POST', body: fields })).data.reference;
  assert.equal((await request('/api/scores/' + id, { method: 'PUT', cookie: org, body: { taste: 10, texture: 10, presentation: 10 } })).status, 403);
  assert.equal((await request('/api/participants/' + id, { method: 'PATCH', cookie: jury, body: { status: 'withdrawn' } })).status, 403);
  assert.equal((await request('/api/emails', { cookie: jury })).status, 403);
  assert.equal((await request('/api/registrations', { method: 'POST', origin: 'https://autre.test', body: fields })).status, 403);
  assert.equal((await request('/api/logout', { method: 'POST', cookie: org, body: {} })).status, 200);
  assert.equal((await request('/api/me', { cookie: org })).status, 401);
});
test('Authentification : mot de passe erroné, cookie protégé, session expirée', async t => {
  const { store, request } = await fixture(t);
  await store.createUser('org@example.test', password, 'organizer');
  assert.equal((await request('/api/login', { method: 'POST', body: { email: 'org@example.test', password: 'incorrect' } })).status, 401);
  const result = await request('/api/login', { method: 'POST', body: { email: 'org@example.test', password } });
  assert.match(result.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  const cookie = result.headers.get('set-cookie').split(';')[0];
  store.db.prepare("UPDATE sessions SET expires_at='2000-01-01T00:00:00.000Z'").run();
  assert.equal((await request('/api/me', { cookie })).status, 401);
});
test('Persistance : les inscriptions survivent à la réouverture de SQLite', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'canal-persist-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const cfg = config({ DATABASE_PATH: join(dir, 'db.sqlite') });
  const p = { id: randomUUID(), ...fields, created_at: new Date().toISOString() };
  let store = await createStore(cfg); await store.createRegistration(p, emailJobs(p, cfg)); store.close();
  store = await createStore(cfg);
  assert.equal((await store.listParticipants())[0].id, p.id); assert.equal((await store.listEmails()).length, 2); store.close();
});
test('Atomicité : échec de création des e-mails annule aussi l’inscription', async t => {
  const { store, cfg } = await fixture(t);
  const p = { id: randomUUID(), ...fields, created_at: new Date().toISOString() };
  const jobs = emailJobs(p, cfg); jobs[1].kind = 'invalid';
  await assert.rejects(() => store.createRegistration(p, jobs));
  assert.equal((await store.listParticipants()).length, 0); assert.equal((await store.listEmails()).length, 0);
});
test('Rappel : pas d’envoi anticipé, un seul traitement après J−1 même en concurrence', async t => {
  const { store, cfg } = await fixture(t);
  const before = new Date('2099-12-02T12:00:00Z');
  const p = { id: randomUUID(), ...fields, created_at: before.toISOString() };
  await store.createRegistration(p, emailJobs(p, cfg, before));
  await processEmails(store, cfg, before);
  assert.equal((await store.listEmails()).find(j => j.kind === 'reminder').state, 'pending');
  const runs = await Promise.all([processEmails(store, cfg, new Date('2099-12-03T14:00:00Z')), processEmails(store, cfg, new Date('2099-12-03T14:00:00Z'))]);
  assert.equal(runs.flat().length, 1);
  const reminder = (await store.listEmails()).find(j => j.kind === 'reminder');
  assert.equal(reminder.state, 'simulated'); assert.equal(reminder.attempts, 1);
});
test('Planificateur : accès secret exigé et rappel périmé ignoré', async t => {
  const { store, cfg, request } = await fixture(t);
  assert.equal((await request('/api/cron/emails')).status, 401);
  assert.equal((await request('/api/cron/emails', { authorization: 'Bearer ' + cfg.cronSecret })).status, 200);
  const p = { id: randomUUID(), ...fields, created_at: '2099-12-01T00:00:00Z' };
  await store.createRegistration(p, emailJobs(p, cfg, new Date(p.created_at)));
  await processEmails(store, cfg, new Date('2099-12-05T00:00:00Z'));
  assert.equal((await store.listEmails()).find(j => j.kind === 'reminder').state, 'skipped');
});
test('Brevo : acceptation, refus et interruption sans faux statut de livraison', async t => {
  for (const [name, fetcher, state] of [
    ['acceptation', async () => new Response(JSON.stringify({ messageId: '<test>' }), { status: 201 }), 'accepted'],
    ['refus', async () => new Response('{}', { status: 400 }), 'failed'],
    ['interruption', async () => { throw new Error('timeout'); }, 'uncertain'],
    ['erreur serveur', async () => new Response('{}', { status: 503 }), 'uncertain']
  ]) await t.test(name, async t => {
    const { store, cfg } = await fixture(t); const now = new Date('2099-12-01T00:00:00Z');
    const p = { id: randomUUID(), ...fields, created_at: now.toISOString() };
    await store.createRegistration(p, emailJobs(p, cfg, now));
    let calls = 0;
    const fake = async (url, options) => { calls++; assert.equal(url, 'https://api.brevo.com/v3/smtp/email'); assert.equal(JSON.parse(options.body).to[0].email, fields.email); return fetcher(); };
    await processEmails(store, { ...cfg, emailMode: 'brevo' }, now, fake);
    const job = (await store.listEmails()).find(j => j.kind === 'confirmation'); assert.equal(job.state, state);
    await processEmails(store, { ...cfg, emailMode: 'brevo' }, now, fake); assert.equal(calls, 1);
  });
});
test('Pages servies : ressources présentes et politique de sécurité sans scripts intégrés', async t => {
  const { request } = await fixture(t);
  for (const path of ['/', '/equipe', '/style.css', '/app.js', '/team.js']) {
    const result = await request(path); assert.equal(result.status, 200); assert.ok(result.data.length > 100);
    assert.match(result.headers.get('content-security-policy'), /script-src 'self'/);
  }
  assert.equal((await request('/.env')).status, 404);
  assert.equal((await request('/src/store.mjs')).status, 404);
});
