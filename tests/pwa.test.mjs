import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../dist/', import.meta.url);
test('PWA : manifeste autonome limité à /app/ et icônes aux dimensions requises', () => {
  const manifest = JSON.parse(readFileSync(new URL('app/manifest.webmanifest', root), 'utf8'));
  assert.equal(manifest.id, '/app/');
  assert.equal(manifest.start_url, '/app/');
  assert.equal(manifest.scope, '/app/');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL(icon.src.slice(1), root));
    const [width, height] = icon.sizes.split('x').map(Number);
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
  }
  assert.ok(existsSync(new URL('app/icons/apple-touch-icon.png', root)));
});
test('Séparation : aucun lien de gestion sur la landing page, ancien accès redirigé', () => {
  const landing = readFileSync(new URL('index.html', root), 'utf8');
  assert.equal(landing.includes('equipe.html'), false);
  assert.equal(landing.includes('Espace équipe'), false);
  assert.equal(landing.includes('/app/'), false);
  const app = readFileSync(new URL('app/index.html', root), 'utf8');
  assert.ok(app.includes('href="/app/manifest.webmanifest"'));
  assert.ok(app.includes('src="/app/team.js"'));
  assert.match(readFileSync(new URL('equipe.html', root), 'utf8'), /url=\/app\//);
});
test('Service worker : aucune interception des API, authentification ou requêtes privées', () => {
  const listeners = {};
  vm.runInNewContext(readFileSync(new URL('app/sw.js', root), 'utf8'), {
    self: { location: { origin: 'https://demo.test' }, addEventListener(name, fn) { listeners[name] = fn; } },
    URL
  });
  for (const request of [
    new Request('https://demo.test/api/participants'),
    new Request('https://xeeixhbhfsdxrgeotlix.supabase.co/functions/v1/consulter-participants'),
    new Request('https://demo.test/app/', { headers: { Authorization: 'Bearer test' } }),
    new Request('https://demo.test/app/', { method: 'POST', body: '{}' }),
    new Request('https://demo.test/')
  ]) listeners.fetch({ request, respondWith() { assert.fail('Cette requête ne doit pas être interceptée'); } });
});
test('Service worker : échec réseau limité à une coquille vide de connexion', async () => {
  const listeners = {};
  vm.runInNewContext(readFileSync(new URL('app/sw.js', root), 'utf8'), {
    self: { location: { origin: 'https://demo.test' }, addEventListener(name, fn) { listeners[name] = fn; } },
    URL, Response, fetch: async () => { throw new Error('offline'); },
    caches: { open: async () => ({ match: async path => { assert.equal(path, '/app/'); return new Response('<form>Connexion requise</form>'); } }) }
  });
  let pending;
  listeners.fetch({ request: new Request('https://demo.test/app/'), respondWith(promise) { pending = promise; } });
  assert.equal(await (await pending).text(), '<form>Connexion requise</form>');
});
