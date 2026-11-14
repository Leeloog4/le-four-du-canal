import test from 'node:test';
import assert from 'node:assert/strict';

let handler;
const env = { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'private-test', SUPABASE_ANON_KEY: 'public-test', BREVO_API_KEY: 'brevo-private-test', BREVO_SENDER_EMAIL: 'expediteur@example.test', BREVO_SENDER_NAME: 'Le Four du Canal', BREVO_TEST_RECIPIENT: 'destinataire@example.test' };
globalThis.Deno = { serve(fn) { handler = fn; }, env: { get(key) { return env[key]; } } };
await import('../supabase/functions/envoyer-email-test/index.ts');
const uid = '6c47adac-7fc9-41be-beaa-11b7717dbba6';
const request = (token = 'session-test', method = 'POST') => new Request('https://test.invalid/functions/v1/envoyer-email-test', {
  method, headers: { Origin: 'https://four-du-canal-exercice.leeloog4.chatgpt.site', ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' },
  ...(method === 'POST' ? { body: JSON.stringify({ recipient: 'autre@example.test', role: 'organizer' }) } : {})
});
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
function mock(t, { role = 'organizer', authStatus = 200, brevo = async () => response({ messageId: '<message-test>' }, 201) } = {}) {
  const original = globalThis.fetch; const calls = [];
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user')) return response({ id: uid }, authStatus);
    if (url.includes('/team_users?')) return response(role ? [{ role }] : []);
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    return brevo(options);
  };
  return calls;
}
test('Test e-mail : anonyme et session invalide refusés sans appel Brevo', async t => {
  assert.equal((await handler(request(null))).status, 401);
  assert.equal((await handler(request(null, 'OPTIONS'))).status, 204);
  const calls = mock(t, { authStatus: 401 });
  assert.equal((await handler(request())).status, 401); assert.equal(calls.length, 1);
});
test('Test e-mail : compte jury refusé même avec un faux rôle dans le corps', async t => {
  const calls = mock(t, { role: 'jury' });
  assert.equal((await handler(request())).status, 403);
  assert.equal(calls.some(c => c.url.includes('api.brevo.com')), false);
});
test('Test e-mail : destinataire imposé par secret et acceptation distincte de livraison', async t => {
  const calls = mock(t);
  const res = await handler(request()); assert.equal(res.status, 200);
  const data = await res.json(); assert.equal(data.state, 'accepted');
  assert.equal(data.message_id, '<message-test>'); assert.match(data.message, /Vérifiez votre boîte/);
  const call = calls.at(-1); const body = JSON.parse(call.options.body);
  assert.equal(body.to[0].email, env.BREVO_TEST_RECIPIENT);
  assert.equal(body.sender.email, env.BREVO_SENDER_EMAIL);
  assert.equal(body.subject.startsWith('[TEST]'), true);
  assert.equal(call.options.headers['api-key'], env.BREVO_API_KEY);
  assert.equal(JSON.stringify(data).includes(env.BREVO_API_KEY), false);
  assert.equal(calls.filter(c => c.url.includes('api.brevo.com')).length, 1);
});
test('Test e-mail : secret manquant, aucun appel fournisseur', async t => {
  const original = env.BREVO_API_KEY; delete env.BREVO_API_KEY;
  t.after(() => { env.BREVO_API_KEY = original; });
  const calls = mock(t);
  assert.equal((await handler(request())).status, 503);
  assert.equal(calls.some(c => c.url.includes('api.brevo.com')), false);
});
test('Test e-mail : refus, erreur serveur et interruption sans renvoi automatique', async t => {
  for (const [name, brevo, expected] of [
    ['refus', async () => response({}, 400), 'failed'],
    ['erreur', async () => response({}, 503), 'uncertain'],
    ['sans identifiant', async () => response({}, 201), 'uncertain'],
    ['interruption', async () => { throw new Error('brevo-private-test'); }, 'uncertain']
  ]) await t.test(name, async t => {
    const calls = mock(t, { brevo });
    const res = await handler(request()); assert.equal(res.status, 502);
    const text = await res.text(); assert.equal(JSON.parse(text).state, expected);
    assert.equal(text.includes('brevo-private-test'), false);
    assert.equal(calls.filter(c => c.url.includes('api.brevo.com')).length, 1);
  });
});
