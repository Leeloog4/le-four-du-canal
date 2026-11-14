import test from 'node:test';
import assert from 'node:assert/strict';

let handler;
const organizerId = '6c47adac-7fc9-41be-beaa-11b7717dbba6';
const participantId = '12345678-1234-4234-8234-123456789abc';
globalThis.Deno = { serve(fn) { handler = fn; }, env: { get(key) { return { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'private-test', SUPABASE_ANON_KEY: 'public-test' }[key]; } } };
await import('../supabase/functions/changer-statut-participant/index.ts');
const valid = { participant_id: participantId, status: 'withdrawn' };
const request = (data = valid, token = 'session-test', method = 'POST') => new Request('https://test.invalid/functions/v1/changer-statut-participant', {
  method, headers: { Origin: 'https://four-du-canal-exercice.leeloog4.chatgpt.site', 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  ...(method === 'POST' ? { body: JSON.stringify(data) } : {})
});
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
function mock(t, { role = 'organizer', authStatus = 200, rpcCode } = {}) {
  const original = globalThis.fetch, calls = [];
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user')) return response({ id: organizerId }, authStatus);
    if (url.includes('/team_users?')) return response(role ? [{ role }] : []);
    if (url.endsWith('/rpc/set_participant_status')) return rpcCode ? response({ code: rpcCode }, 400) : response(null);
    throw new Error('Requête inattendue');
  };
  return calls;
}
test('Statut : session requise et jeton invalide refusé', async t => {
  assert.equal((await handler(request(valid, null))).status, 401);
  assert.equal((await handler(request(valid, null, 'OPTIONS'))).status, 204);
  const calls = mock(t, { authStatus: 401 });
  assert.equal((await handler(request())).status, 401); assert.equal(calls.length, 1);
});
test('Statut : jury refusé même si le corps prétend être organisateur', async t => {
  const calls = mock(t, { role: 'jury' });
  assert.equal((await handler(request({ ...valid, role: 'organizer' }))).status, 403);
  assert.equal(calls.some(c => c.url.includes('/rpc/')), false);
});
test('Statut : retrait et réactivation transmis sans suppression ou modification des notes', async t => {
  const calls = mock(t);
  for (const status of ['withdrawn', 'registered']) {
    const res = await handler(request({ ...valid, status, taste: 10 }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, status);
    const rpc = calls.at(-1);
    assert.deepEqual(JSON.parse(rpc.options.body), { p_id: participantId, p_status: status });
    assert.equal(rpc.options.headers.apikey, 'private-test');
  }
});
test('Statut : statuts arbitraires et identifiants invalides refusés avant écriture', async t => {
  const calls = mock(t);
  for (const status of ['deleted', '', null]) assert.equal((await handler(request({ ...valid, status }))).status, 422);
  assert.equal((await handler(request({ ...valid, participant_id: 'invalide' }))).status, 422);
  assert.equal(calls.some(c => c.url.includes('/rpc/')), false);
});
test('Statut : erreurs métier sans détails internes', async t => {
  for (const [code, expected] of [['P0002', 404], ['22023', 422], ['unexpected', 503]]) await t.test(code, async t => {
    mock(t, { rpcCode: code });
    const res = await handler(request()); assert.equal(res.status, expected);
    assert.equal((await res.text()).includes('private-test'), false);
  });
});
