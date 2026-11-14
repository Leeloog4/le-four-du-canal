import { createServer } from 'node:http';
import { config } from './config.mjs';
import { createStore } from './store.mjs';
import { createApp } from './app.mjs';
import { processEmails } from './emails.mjs';

const cfg = config();
const store = await createStore(cfg);
const server = createServer(createApp(store, cfg));
server.requestTimeout = 30_000;
server.listen(cfg.port, cfg.host, () => console.log(`Le Four du Canal : ${cfg.origin} — ${cfg.backend}, e-mails ${cfg.emailMode}`));
// Planificateur local : actif seulement tant que ce processus tourne.
const timer = setInterval(() => processEmails(store, cfg).catch(() => console.error('Traitement e-mails indisponible')), 30_000);
timer.unref();
function stop() { clearInterval(timer); server.close(() => { store.close(); process.exit(0); }); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
