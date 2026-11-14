import test from 'node:test';
import assert from 'node:assert/strict';
let handler;
const env = { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-service',
  BREVO_API_KEY: 'fake-brevo', BREVO_SENDER_EMAIL: 'sender@example.test',
  REMINDERS_CRON_SECRET: 'test-only-secret-at-least-32-characters', REMINDERS_ENABLED: 'true', EVENT_AT: '2099-12-04T14:00:00Z' };
globalThis.Deno = { serve(fn) { handler = fn; }, env: { get(key) { return env[key]; } } };
await import('../supabase/functions/traiter-rappels/index.ts');
const request = (secret = env.REMINDERS_CRON_SECRET, method = 'POST') => new Request('https://test.invalid', {
  method, headers: { 'x-cron-secret': secret },
  ...(method === 'POST' ? { body: JSON.stringify({ recipient: 'intrus@ailleurs.fr', now: '2099-12-04' }) } : {})
});
const job = { id: 'job-1', participant_id: 'participant-1', kind: 'reminder', recipient: 'camille@courriel-exercice.fr', subject: '[DÉMONSTRATION] Rappel', content: 'Exercice fictif' };
function mock(t, options = {}) {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  const calls = [], saved = [];
  globalThis.fetch = async (url, init) => {
    calls.push(url);
    if (url.endsWith('/rpc/claim_reminders')) {
      assert.deepEqual(JSON.parse(init.body), { p_event_at: new Date(env.EVENT_AT).toISOString() });
      return new Response(JSON.stringify(options.jobs ?? [job]), { status: options.claimFails ? 500 : 200 });
    }
    if (url.includes('/participants?')) return new Response(JSON.stringify([{ status: options.withdrawn ? 'withdrawn' : 'registered' }]));
    if (url.includes('api.brevo.com')) {
      const data = JSON.parse(init.body);
      assert.equal(data.to[0].email, job.recipient);
      assert.equal(init.headers['api-key'], 'fake-brevo');
      if (options.networkFails) throw new Error('timeout');
      return new Response(JSON.stringify(options.noId ? {} : { messageId: '<mock-id>' }), { status: options.status || 201 });
    }
    if (url.includes('/email_jobs?')) {
      assert.match(url, /state=eq.processing/); saved.push(JSON.parse(init.body));
      return new Response(null, { status: options.saveFails ? 500 : 204 });
    }
    throw new Error('Appel inattendu');
  };
  return { calls, saved };
}
test('Rappels : refus sans authentification, secret manquant et mauvaise méthode sans réseau', async t => {
  const w = mock(t);
  assert.equal((await handler(request(''))).status, 401);
  assert.equal((await handler(request('incorrect'))).status, 401);
  assert.equal((await handler(request(undefined, 'GET'))).status, 405);
  const old = env.REMINDERS_CRON_SECRET; delete env.REMINDERS_CRON_SECRET;
  t.after(() => { env.REMINDERS_CRON_SECRET = old; });
  assert.equal((await handler(request('incorrect'))).status, 503);
  assert.equal(w.calls.length, 0);
});
test('Rappels : désactivation et configuration incomplète ne réclament rien', async t => {
  const w = mock(t); env.REMINDERS_ENABLED = 'false';
  t.after(() => { env.REMINDERS_ENABLED = 'true'; env.BREVO_API_KEY = 'fake-brevo'; });
  assert.deepEqual(await (await handler(request())).json(), { enabled: false, processed: 0 });
  env.REMINDERS_ENABLED = 'true'; delete env.BREVO_API_KEY;
  assert.equal((await handler(request())).status, 503); assert.equal(w.calls.length, 0);
});
test('Rappels : acceptation enregistrée, destinataire serveur et retour sans données privées', async t => {
  const w = mock(t); const response = await handler(request());
  assert.equal(response.status, 200); const text = await response.text();
  assert.equal(JSON.parse(text).accepted, 1); assert.equal(text.includes(job.recipient), false);
  assert.equal(text.includes('fake-'), false); assert.equal(w.saved[0].message_id, '<mock-id>');
});
test('Rappels : rien de dû ou réclamation concurrente sans appel fournisseur', async t => {
  const w = mock(t, { jobs: [] }); const response = await handler(request());
  assert.equal((await response.json()).processed, 0); assert.equal(w.calls.length, 1);
});
test('Rappels : refus, panne, réponse sans identifiant et interruption conservés sans nouvel essai', async t => {
  for (const [options, expected] of [[{ status: 400 }, 'failed'], [{ status: 503 }, 'uncertain'], [{ noId: true }, 'uncertain'], [{ networkFails: true }, 'uncertain']]) {
    await t.test(expected + JSON.stringify(options), async t => {
      const w = mock(t, options); assert.equal((await handler(request())).status, 200);
      assert.equal(w.saved[0].state, expected); assert.equal(w.calls.filter(url => url.includes('brevo.com')).length, 1);
    });
  }
});
test('Rappels : retrait intervenu après réclamation interdit l’envoi', async t => {
  const w = mock(t, { withdrawn: true }); await handler(request());
  assert.equal(w.saved[0].state, 'skipped'); assert.equal(w.calls.some(url => url.includes('brevo.com')), false);
});
test('Rappels : adresse réservée simulée, aucune confirmation envoyée par ce worker', async t => {
  for (const [row, expected] of [[{ ...job, recipient: 'demo@example.test' }, 'simulated'], [{ ...job, kind: 'confirmation' }, 'failed']]) {
    await t.test(expected, async t => {
      const w = mock(t, { jobs: [row] }); await handler(request());
      assert.equal(w.saved[0].state, expected); assert.equal(w.calls.some(url => url.includes('brevo.com')), false);
    });
  }
});
test('Rappels : réclamation en erreur et résultat non enregistré signalés sans reprise', async t => {
  await t.test('réclamation', async t => {
    const w = mock(t, { claimFails: true }); assert.equal((await handler(request())).status, 503); assert.equal(w.calls.length, 1);
  });
  await t.test('enregistrement', async t => {
    const w = mock(t, { saveFails: true }); assert.equal((await handler(request())).status, 503);
    assert.equal(w.calls.filter(url => url.includes('brevo.com')).length, 1);
  });
});

test('Rappels : échéance dépassée avant appel fournisseur sans envoi', async t => {
  const old = env.EVENT_AT; env.EVENT_AT = '2000-01-01T14:00:00Z';
  t.after(() => { env.EVENT_AT = old; });
  const w = mock(t); await handler(request());
  assert.equal(w.saved[0].state, 'skipped');
  assert.equal(w.calls.some(url => url.includes('brevo.com')), false);
});
