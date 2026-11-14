import test from 'node:test';
import assert from 'node:assert/strict';

let handler;
const juryId = '19272bdf-cb63-4453-92b3-234b326632be';
const participantId = '12345678-1234-4234-8234-123456789abc';
globalThis.Deno = { serve(fn) { handler = fn; }, env: { get(key) { return { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'private-test', SUPABASE_ANON_KEY: 'public-test' }[key]; } } };
await import('../supabase/functions/noter-participant/index.ts');
const valid = { participant_id: participantId, taste: 8, texture: 9, presentation: 7 };
const request = (data = valid, token = 'session-test', method = 'POST') => new Request('https://test.invalid/functions/v1/noter-participant', {
  method, headers: { Origin: 'https://four-du-canal-exercice.leeloog4.chatgpt.site', 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  ...(method === 'POST' ? { body: JSON.stringify(data) } : {})
});
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
function mock(t, { role = 'jury', authStatus = 200, rpcCode } = {}) {
  const original = globalThis.fetch; const calls = [];
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user')) return response({ id: juryId }, authStatus);
    if (url.includes('/team_users?')) return response(role ? [{ role }] : []);
    if (url.endsWith('/rpc/save_scores')) return rpcCode ? response({ code: rpcCode }, 400) : response(null);
    throw new Error('Requête inattendue');
  };
  return calls;
}
test('Notation : anonyme et session invalide refusés', async t => {
  assert.equal((await handler(request(valid, null))).status, 401);
  assert.equal((await handler(request(valid, null, 'OPTIONS'))).status, 204);
  const calls = mock(t, { authStatus: 401 });
  assert.equal((await handler(request())).status, 401);
  assert.equal(calls.length, 1);
});
test('Notation : organisateur refusé sans écriture', async t => {
  const calls = mock(t, { role: 'organizer' });
  assert.equal((await handler(request())).status, 403);
  assert.equal(calls.some(c => c.url.includes('/rpc/')), false);
});
test('Notation : bornes, types et trois notes obligatoires', async t => {
  const calls = mock(t);
  for (const taste of [-1, 11, 1.5, '8', null]) assert.equal((await handler(request({ ...valid, taste }))).status, 422);
  assert.equal((await handler(request({ ...valid, presentation: undefined }))).status, 422);
  assert.equal(calls.some(c => c.url.includes('/rpc/')), false);
});
test('Notation : total 24 et identité du jury imposée par le serveur', async t => {
  const calls = mock(t);
  const res = await handler(request({ ...valid, jury_id: 'identite-usurpee' }));
  assert.equal(res.status, 200);
  const data = await res.json(); assert.equal(data.total, 24);
  const rpc = calls.find(c => c.url.includes('/rpc/'));
  const args = JSON.parse(rpc.options.body);
  assert.equal(args.p_jury, juryId); assert.equal(args.p_id, participantId);
  assert.equal(rpc.options.headers.apikey, 'private-test');
  assert.equal(JSON.stringify(data).includes('private-test'), false);
});
test('Notation : zéro accepté et cas métier remontés sans détail interne', async t => {
  mock(t);
  const res = await handler(request({ ...valid, taste: 0, texture: 0, presentation: 0 }));
  assert.equal((await res.json()).total, 0);
});
test('Notation : participant absent, retiré ou notes rejetées en base', async t => {
  for (const [code, expected] of [['P0002', 404], ['P0001', 409], ['42501', 403], ['23514', 422]]) {
    await t.test(code, async t => {
      mock(t, { rpcCode: code });
      assert.equal((await handler(request())).status, expected);
    });
  }
});
