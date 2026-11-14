import { config } from '../src/config.mjs';
import { createStore } from '../src/store.mjs';
import { createApp } from '../src/app.mjs';
let app;
export default async function handler(req, res) {
  try {
    if (!app) { const cfg = config(); if (cfg.backend !== 'supabase') throw new Error('Supabase requis'); app = createApp(await createStore(cfg), cfg); }
    return app(req, res);
  } catch { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Configuration serveur incomplète.' })); }
}
