import test from 'node:test';
import assert from 'node:assert/strict';
let handler;
const env = { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'private-test', SUPABASE_ANON_KEY: 'public-test' };
globalThis.Deno = { serve(fn) { handler = fn; }, env: { get(key) { return env[key]; } } };
await import('../supabase/functions/consulter-emails/index.ts');
const uid = '6c47adac-7fc9-41be-beaa-11b7717dbba6';
const origin = 'https://four-du-canal-exercice.leeloog4.chatgpt.site';
const req = (token = 'Bearer session-test', method = 'GET', from = origin) => new Request('https://test.invalid', { method, headers: { Origin: from, Authorization: token } });
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
const row = { id: 'job', participant_id: 'p', recipient: 'camille@example.test', kind: 'reminder', state: 'simulated', attempts: 1,
  subject: 'Exercice', content: 'Contenu fictif', due_at: '2026-12-03T14:00:00Z', message_id: null, last_error: 'Adresse fictive',
  participants: { first_name: 'Camille', last_name: 'Martin', status: 'withdrawn', extra: 'non-diffuse' }, extra: 'non-diffuse' };
function mock(t, options = {}) {
  const before = globalThis.fetch; t.after(() => { globalThis.fetch = before; });
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(url); assert.equal(init.method, undefined); // Lecture seule.
    if (options.networkFails) throw new Error('private-test');
    if (url.endsWith('/auth/v1/user')) {
      assert.equal(init.headers.Authorization, 'Bearer session-test');
      return reply({ id: options.invalidIdentity ? 'invalid' : uid }, options.authStatus || 200);
    }
    assert.equal(init.headers.apikey, 'private-test');
    if (url.includes('/team_users?')) return reply(options.noRole ? [] : [{ role: options.role || 'organizer' }], options.roleStatus || 200);
    if (url.includes('/email_jobs?')) {
      assert.ok(url.includes('content')); assert.ok(url.includes('order=created_at.desc,id.asc'));
      if (options.pagination && init.headers.Range === '0-499') return reply(Array.from({ length: 500 }, () => row));
      if (options.pagination) assert.equal(init.headers.Range, '500-999');
      return reply(options.invalidRows ? {} : options.empty ? [] : [row], options.dataStatus || 200);
    }
    throw new Error('URL inattendue');
  };
  return calls;
}
test('Historique serveur : origine, prévol, méthode et accès anonyme', async t => {
  const calls = mock(t);
  assert.equal((await handler(req('', 'GET'))).status, 401);
  assert.equal((await handler(req('', 'OPTIONS'))).status, 204);
  assert.equal((await handler(req('', 'POST'))).status, 405);
  assert.equal((await handler(req('', 'GET', 'https://intrus.invalid'))).status, 403);
  assert.equal(calls.length, 0);
});
test('Historique serveur : session expirée refusée avant tout accès privé', async t => {
  const calls = mock(t, { authStatus: 401 }); assert.equal((await handler(req())).status, 401); assert.equal(calls.length, 1);
});
test('Historique serveur : jury et compte sans rôle refusés avant lecture des messages', async t => {
  for (const option of [{ role: 'jury' }, { noRole: true }]) await t.test(JSON.stringify(option), async t => {
    const calls = mock(t, option); assert.equal((await handler(req())).status, 403); assert.equal(calls.length, 2);
  });
});
test('Historique serveur : organisateur, texte et états réels sans champs supplémentaires', async t => {
  const calls = mock(t); const response = await handler(req());
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const text = await response.text(); const data = JSON.parse(text);
  assert.equal(data.emails[0].recipient, row.recipient); assert.equal(data.emails[0].attempts, 1);
  assert.equal(data.emails[0].participant.status, 'withdrawn'); assert.equal(data.emails[0].content, row.content);
  assert.equal(text.includes('private-test'), false); assert.equal(text.includes('non-diffuse'), false); assert.equal(calls.length, 3);
});
test('Historique serveur : pagination au-delà de 500 messages et liste vide', async t => {
  await t.test('pages', async t => {
    const calls = mock(t, { pagination: true }); const data = await (await handler(req())).json(); assert.equal(data.emails.length, 501); assert.equal(calls.length, 4);
  });
  await t.test('vide', async t => { mock(t, { empty: true }); assert.deepEqual(await (await handler(req())).json(), { emails: [] }); });
});
test('Historique serveur : pannes et réponses invalides sans fuite de secret', async t => {
  for (const option of [{ authStatus: 503 }, { invalidIdentity: true }, { roleStatus: 500 }, { dataStatus: 500 }, { invalidRows: true }, { networkFails: true }]) {
    await t.test(JSON.stringify(option), async t => { mock(t, option); const response = await handler(req()); assert.equal(response.status, 503); assert.equal((await response.text()).includes('private-test'), false); });
  }
});
