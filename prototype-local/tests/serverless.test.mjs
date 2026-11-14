import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { SqliteStore } from '../src/store.mjs';
import { createApp } from '../src/app.mjs';
import { config } from '../src/config.mjs';

test('Contrat serverless : corps JSON déjà décodé accepté, taille contrôlée', async t => {
  const store = new SqliteStore(new DatabaseSync(':memory:')); t.after(() => store.close());
  const cfg = config({ EVENT_AT: '2099-12-04T14:00:00Z' });
  const app = createApp(store, cfg);
  async function request(body) {
    const req = { url: '/api/registrations', method: 'POST', headers: { origin: cfg.origin, 'content-type': 'application/json' }, socket: { remoteAddress: 'local' }, body };
    const response = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, writeHead(code) { this.status = code; this.headersSent = true; }, end(data) { this.data = JSON.parse(data); } };
    await app(req, response); return response;
  }
  assert.equal((await request({ first_name: 'Camille', last_name: 'Martin', email: 'camille@example.test' })).status, 201);
  assert.equal((await request({ first_name: 'x'.repeat(17_000) })).status, 413);
  assert.equal((await request('JSON invalide')).status, 400);
});
