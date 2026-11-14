import test from 'node:test';
import assert from 'node:assert/strict';

let handler;
const env = { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'secret-fictif', BREVO_API_KEY: 'brevo-secret-test', BREVO_SENDER_EMAIL: 'expediteur@example.test', BREVO_SENDER_NAME: 'Le Four du Canal' };
globalThis.Deno = { serve(fn) { handler = fn; }, env: { get(key) { return env[key]; } } };
await import('../supabase/functions/inscrire-participant/index.ts');
const origin = 'https://four-du-canal-exercice.leeloog4.chatgpt.site';
const valid = { first_name: ' Camille ', last_name: 'Martin', email: ' CAMILLE@EXAMPLE.TEST ' };
const request = (body = valid, method = 'POST', originValue = origin) => new Request('https://test.invalid/functions/v1/inscrire-participant', {
  method, headers: { Origin: originValue, 'Content-Type': 'application/json' },
  ...(method === 'POST' ? { body: JSON.stringify(body) } : {})
});

test('Fonction inscription : origine, prévol et méthode', async () => {
  assert.equal((await handler(request(valid, 'POST', 'https://autre.invalid'))).status, 403);
  const preflight = await handler(request(valid, 'OPTIONS'));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal((await handler(request(valid, 'GET'))).status, 405);
});
test('Fonction inscription : champs invalides refusés avant accès base', async () => {
  assert.equal((await handler(request({}))).status, 422);
  assert.equal((await handler(request({ ...valid, website: 'robot' }))).status, 422);
  assert.equal((await handler(request({ ...valid, email: 'invalide' }))).status, 422);
  assert.equal((await handler(request({ ...valid, first_name: 'x'.repeat(9000) }))).status, 413);
});
test('Fonction inscription : contrat serveur, normalisation et aucune clé dans le retour', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://test.invalid/rest/v1/rpc/register_participant');
    assert.equal(options.headers.apikey, 'secret-fictif');
    const payload = JSON.parse(options.body);
    const row = payload.p_participant;
    assert.equal(payload.p_jobs.length, 2);
    assert.equal(payload.p_jobs[0].state, 'simulated');
    assert.equal(payload.p_jobs[1].state, 'simulated');
    assert.equal(row.first_name, 'Camille'); assert.equal(row.email, 'camille@example.test');
    assert.match(row.id, /^[a-f0-9-]{36}$/);
    return new Response(JSON.stringify(row.id), { status: 200 });
  };
  const result = await handler(request());
  assert.equal(result.status, 201);
  const text = await result.text();
  assert.equal(JSON.parse(text).email_state, 'simulated');
  assert.equal(text.includes('secret-fictif'), false);
});
test('Fonction inscription : doublon, erreur base et interruption', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => new Response(JSON.stringify({ code: '23505' }), { status: 409 });
  assert.equal((await handler(request())).status, 409);
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  assert.equal((await handler(request())).status, 503);
  globalThis.fetch = async () => { throw new Error('network'); };
  assert.equal((await handler(request())).status, 503);
});

function workflow(t, options = {}) {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const calls = [], saved = [];
  let payload;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    const body = init.body ? JSON.parse(init.body) : null;
    if (url.endsWith('/rpc/register_participant')) {
      payload = body;
      assert.equal(payload.p_jobs.length, 2);
      assert.equal(payload.p_jobs[0].kind, 'confirmation');
      assert.equal(payload.p_jobs[1].kind, 'reminder');
      assert.match(payload.p_jobs[0].content, /Date fictive/);
      if (options.registrationFails) return new Response('{}', { status: 500 });
      return new Response(JSON.stringify(payload.p_participant.id));
    }
    if (url.endsWith('/rpc/claim_emails')) {
      assert.equal(body.p_participant, payload.p_participant.id);
      assert.equal(body.p_now, payload.p_jobs[0].due_at);
      if (options.claimFails) return new Response('{}', { status: 500 });
      return new Response(JSON.stringify(options.alreadyClaimed ? [] : [{ id: 'job-confirmation', recipient: payload.p_participant.email, ...payload.p_jobs[0] }]));
    }
    if (url.includes('/email_jobs?select=state')) return new Response(JSON.stringify([{ state: 'processing' }]));
    if (url === 'https://api.brevo.com/v3/smtp/email') {
      assert.equal(body.to[0].email, payload.p_participant.email);
      assert.equal(init.headers['api-key'], env.BREVO_API_KEY);
      return options.brevo ? options.brevo() : new Response(JSON.stringify({ messageId: '<confirmation-test>' }), { status: 201 });
    }
    if (url.includes('/email_jobs?id=eq.')) {
      assert.equal(init.method, 'PATCH'); saved.push(body);
      return new Response(null, { status: options.saveFails ? 500 : 204 });
    }
    throw new Error('URL inattendue');
  };
  return { calls, saved, payload: () => payload };
}
const realAddressInput = { ...valid, email: 'camille@courriel-exercice.fr' };
test('Confirmation : inscription et deux tâches avant appel Brevo, résultat enregistré', async t => {
  const w = workflow(t);
  const res = await handler(request(realAddressInput));
  assert.equal(res.status, 201);
  const data = await res.json(); assert.equal(data.email_state, 'accepted'); assert.equal(data.reminder_state, 'pending');
  assert.equal(w.calls[0].url.endsWith('/rpc/register_participant'), true);
  assert.equal(w.saved[0].state, 'accepted'); assert.equal(w.saved[0].message_id, '<confirmation-test>');
  assert.equal(w.payload().p_jobs[1].due_at, '2026-12-03T14:00:00.000Z');
  assert.equal(JSON.stringify(data).includes('secret'), false);
});
test('Confirmation : échec transactionnel sans appel fournisseur', async t => {
  const w = workflow(t, { registrationFails: true });
  assert.equal((await handler(request(realAddressInput))).status, 503);
  assert.equal(w.calls.length, 1);
});
test('Confirmation : refus et incertitude ne font pas échouer l’inscription', async t => {
  for (const [name, brevo, expected] of [
    ['refus', () => new Response('{}', { status: 400 }), 'failed'],
    ['serveur', () => new Response('{}', { status: 503 }), 'uncertain'],
    ['interruption', () => { throw new Error('timeout'); }, 'uncertain']
  ]) await t.test(name, async t => {
    const w = workflow(t, { brevo }); const res = await handler(request(realAddressInput));
    assert.equal(res.status, 201); assert.equal((await res.json()).email_state, expected);
    assert.equal(w.saved[0].state, expected);
    assert.equal(w.calls.filter(call => call.url.includes('api.brevo.com')).length, 1);
  });
});
test('Confirmation : configuration manquante et tâche déjà réclamée sans doublon', async t => {
  await t.test('configuration', async t => {
    const original = env.BREVO_API_KEY; delete env.BREVO_API_KEY;
    t.after(() => { env.BREVO_API_KEY = original; });
    const w = workflow(t); const res = await handler(request(realAddressInput));
    assert.equal(res.status, 201); assert.equal((await res.json()).email_state, 'pending');
    assert.equal(w.calls.length, 1);
  });
  await t.test('réclamation concurrente', async t => {
    const w = workflow(t, { alreadyClaimed: true }); const res = await handler(request(realAddressInput));
    assert.equal((await res.json()).email_state, 'processing');
    assert.equal(w.calls.some(call => call.url.includes('api.brevo.com')), false);
  });
});
test('Confirmation : résultat non enregistré en base signalé comme incertain', async t => {
  workflow(t, { saveFails: true }); const res = await handler(request(realAddressInput));
  assert.equal(res.status, 201); assert.equal((await res.json()).email_state, 'uncertain');
});
test('Confirmation : adresses réservées simulées et rappel tardif ignoré', async t => {
  const original = env.EVENT_AT; env.EVENT_AT = '2000-01-01T14:00:00Z';
  t.after(() => { if (original === undefined) delete env.EVENT_AT; else env.EVENT_AT = original; });
  const w = workflow(t); const res = await handler(request());
  const data = await res.json();
  assert.equal(data.email_state, 'simulated'); assert.equal(data.reminder_state, 'skipped');
  assert.equal(w.calls.length, 1);
});
