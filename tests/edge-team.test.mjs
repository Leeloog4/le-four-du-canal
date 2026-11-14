import test from 'node:test';
import assert from 'node:assert/strict';

let handler;
globalThis.Deno = { serve(fn) { handler = fn; }, env: { get(key) { return { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'private-test', SUPABASE_ANON_KEY: 'public-test' }[key]; } } };
await import('../supabase/functions/consulter-participants/index.ts');
const uid = '6c47adac-7fc9-41be-beaa-11b7717dbba6';
const origin = 'https://four-du-canal-exercice.leeloog4.chatgpt.site';
const req = (authorization, method = 'GET') => new Request('https://test.invalid/functions/v1/consulter-participants', { method, headers: { Origin: origin, ...(authorization ? { Authorization: authorization } : {}) } });
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
function mock(t, role, authStatus = 200, scores = null) {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push(url);
    if (url.endsWith('/auth/v1/user')) {
      assert.equal(options.headers.Authorization, 'Bearer session-test');
      return response({ id: uid, email: 'organisateur@example.test' }, authStatus);
    }
    assert.equal(options.headers.apikey, 'private-test');
    if (url.includes('/team_users?')) {
      assert.ok(url.includes(uid));
      return response(role ? [{ role }] : []);
    }
    if (url.includes('/participants?')) {
      assert.ok(url.includes('scores(taste,texture,presentation,updated_at)'));
      return response([{ id: 'p', first_name: 'Camille', last_name: 'Martin', email: 'camille@example.test', status: 'registered', scores }]);
    }
    throw new Error('Requête inattendue');
  };
  return calls;
}

test('Espace équipe : accès anonyme, prévol et méthodes', async () => {
  assert.equal((await handler(req(null))).status, 401);
  assert.equal((await handler(req(null, 'OPTIONS'))).status, 204);
  assert.equal((await handler(req('Bearer session-test', 'POST'))).status, 405);
});
test('Espace équipe : jeton expiré refusé avant lecture des rôles ou participants', async t => {
  const calls = mock(t, 'organizer', 401);
  assert.equal((await handler(req('Bearer session-test'))).status, 401);
  assert.equal(calls.length, 1);
});
test('Espace équipe : compte sans rôle refusé avant lecture des participants', async t => {
  const calls = mock(t, null);
  assert.equal((await handler(req('Bearer session-test'))).status, 403);
  assert.equal(calls.length, 2);
});
test('Espace équipe : organisateur reçoit la liste après vérification identité et rôle', async t => {
  const calls = mock(t, 'organizer');
  const res = await handler(req('Bearer session-test'));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  const text = await res.text(); const data = JSON.parse(text);
  assert.equal(data.user.role, 'organizer');
  assert.equal(data.participants[0].email, 'camille@example.test');
  assert.equal(text.includes('private-test'), false);
  assert.equal(calls.length, 3);
});
test('Espace équipe : jury sans coordonnées des participants', async t => {
  mock(t, 'jury');
  const res = await handler(req('Bearer session-test'));
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal('email' in data.participants[0], false);
  assert.equal(data.participants[0].scores, null);
});
test('Espace équipe : notes rechargées, sans identifiant jury ni donnée supplémentaire', async t => {
  mock(t, 'jury', 200, [{ taste: 8, texture: 9, presentation: 7, updated_at: '2026-11-14T00:00:00Z', jury_id: 'non-diffuse', email: 'non-diffuse@example.test' }]);
  const res = await handler(req('Bearer session-test'));
  const data = await res.json();
  assert.deepEqual(data.participants[0].scores, { taste: 8, texture: 9, presentation: 7, updated_at: '2026-11-14T00:00:00Z' });
  assert.equal(JSON.stringify(data.participants).includes('non-diffuse'), false);
});
test('Espace équipe : panne réseau sans fuite de données ni de secret', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => { throw new Error('private-test'); };
  const res = await handler(req('Bearer session-test'));
  assert.equal(res.status, 503);
  assert.equal((await res.text()).includes('private-test'), false);
});
