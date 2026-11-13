import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
function fixture(fetcher, valid = true) {
  let submit;
  const button = { disabled: false, textContent: '' };
  const result = { className: '', textContent: '', focus() {} };
  const values = { first_name: 'Camille', last_name: 'Martin', email: 'camille@example.test', website: '' };
  const form = {
    resetCount: 0, attrs: {},
    querySelector() { return button; },
    reportValidity() { return valid; },
    addEventListener(name, fn) { assert.equal(name, 'submit'); submit = fn; },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    reset() { this.resetCount++; }
  };
  vm.runInNewContext(source, {
    document: { getElementById(id) { return id === 'registration' ? form : result; } },
    FormData: class { constructor() { return Object.entries(values); } },
    fetch: fetcher, AbortSignal, TypeError, SyntaxError, Error
  });
  return { form, result, button, submit: () => submit({ preventDefault() {} }) };
}

test('Formulaire : inscription confirmée seulement après succès serveur', async () => {
  const f = fixture(async (url, options) => {
    assert.equal(url, 'https://xeeixhbhfsdxrgeotlix.supabase.co/functions/v1/inscrire-participant');
    assert.equal(options.method, 'POST');
    assert.equal(JSON.parse(options.body).email, 'camille@example.test');
    assert.deepEqual(Object.keys(options.headers), ['Content-Type']);
    return new Response(JSON.stringify({ reference: 'abcd1234-0000', email_state: 'not_configured' }), { status: 201 });
  });
  await f.submit();
  assert.match(f.result.textContent, /est enregistrée/);
  assert.match(f.result.textContent, /ABCD1234/);
  assert.match(f.result.textContent, /Aucun e-mail/);
  assert.equal(f.form.resetCount, 1);
  assert.equal(f.button.disabled, false);
});
test('Formulaire : doublon ou erreur serveur conservant les champs', async () => {
  for (const status of [409, 422, 503]) {
    const f = fixture(async () => new Response(JSON.stringify({ error: 'Erreur à afficher' }), { status }));
    await f.submit();
    assert.equal(f.result.className, 'notice error');
    assert.equal(f.result.textContent, 'Erreur à afficher');
    assert.equal(f.form.resetCount, 0);
  }
});
test('Formulaire : coupure réseau sans fausse confirmation', async () => {
  const f = fixture(async () => { throw new TypeError('Failed to fetch'); });
  await f.submit();
  assert.match(f.result.textContent, /peut-être été enregistrée/);
  assert.match(f.result.textContent, /même adresse/);
  assert.equal(f.form.resetCount, 0);
  assert.equal(f.button.disabled, false);
});
test('Formulaire : double clic pendant la requête ne crée pas de deuxième envoi', async () => {
  let calls = 0, complete;
  const f = fixture(() => { calls++; return new Promise(resolve => { complete = resolve; }); });
  const pending = f.submit();
  assert.equal(f.button.disabled, true);
  await f.submit();
  assert.equal(calls, 1);
  complete(new Response(JSON.stringify({ reference: 'test-reference' }), { status: 201 }));
  await pending;
  assert.equal(f.button.disabled, false);
});
test('Formulaire : validation navigateur et réponse incomplète', async () => {
  let called = false;
  const f = fixture(async () => { called = true; }, false);
  await f.submit(); assert.equal(called, false);
  const malformed = fixture(async () => new Response('{}', { status: 201 }));
  await malformed.submit();
  assert.equal(malformed.result.className, 'notice error');
  assert.equal(malformed.form.resetCount, 0);
});
