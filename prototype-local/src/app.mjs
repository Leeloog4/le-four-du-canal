import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { HttpError, registrationInput, scoresInput, ranking, emailJobs } from './domain.mjs';
import { secretEquals } from './security.mjs';
import { processEmails } from './emails.mjs';

const assets = { '/': ['index.html', 'text/html; charset=utf-8'], '/equipe': ['team.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/team.js': ['team.js', 'text/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'] };
const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
function session(req) { return (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('canal_session='))?.slice(14) || ''; }
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
async function body(req) {
  if (!String(req.headers['content-type']).startsWith('application/json')) throw new HttpError(415, 'Le formulaire doit être envoyé en JSON.');
  let data = '';
  // Vercel peut avoir déjà lu et décodé le corps de la requête.
  if (req.body !== undefined) data = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? JSON.stringify(req.body) : String(req.body);
  else for await (const chunk of req) { data += chunk; if (Buffer.byteLength(data) > 16_384) throw new HttpError(413, 'Demande trop volumineuse.'); }
  if (Buffer.byteLength(data) > 16_384) throw new HttpError(413, 'Demande trop volumineuse.');
  try { const parsed = JSON.parse(data); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error(); return parsed; }
  catch { throw new HttpError(400, 'Données JSON invalides.'); }
}
export function createApp(store, cfg) {
  const limits = new Map();
  function limit(req, category, max) {
    const key = category + ':' + (req.socket.remoteAddress || 'unknown');
    const now = Date.now();
    if (limits.size > 5000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
    const value = limits.get(key);
    if (!value || value.until < now) limits.set(key, { count: 1, until: now + 60_000 });
    else if (++value.count > max) throw new HttpError(429, 'Trop de tentatives. Réessayez dans une minute.');
  }
  const cookie = (value, age = 3600) => `canal_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${cfg.secure ? '; Secure' : ''}`;
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    const path = new URL(req.url, cfg.origin).pathname;
    try {
      if (path === '/api/cron/emails') {
        if (!['GET', 'POST'].includes(req.method)) throw new HttpError(405, 'Méthode non autorisée.');
        if (!secretEquals(req.headers.authorization || '', cfg.cronSecret ? 'Bearer ' + cfg.cronSecret : '')) throw new HttpError(401, 'Accès au planificateur refusé.');
        return json(res, 200, { processed: await processEmails(store, cfg) });
      }
      if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin !== cfg.origin) throw new HttpError(403, 'Origine de la demande non autorisée.');
      if (req.method === 'GET' && assets[path]) {
        const [name, type] = assets[path];
        const file = await readFile(publicRoot + name);
        res.writeHead(200, { 'Content-Type': type }); return res.end(file);
      }
      if (req.method === 'GET' && path === '/api/config') return json(res, 200, { demo: cfg.demo, event_at: cfg.eventAt, place: cfg.place, email_mode: cfg.emailMode });
      if (req.method === 'POST' && path === '/api/registrations') {
        limit(req, 'registration', 10);
        const input = await body(req);
        if (input.website) throw new HttpError(422, 'La demande n’a pas pu être validée.');
        const fields = registrationInput(input);
        const participant = { id: randomUUID(), ...fields, created_at: new Date().toISOString() };
        await store.createRegistration(participant, emailJobs(participant, cfg));
        // L’inscription reste acquise même si le prestataire e-mail est indisponible.
        let emailState = 'pending';
        try {
          const processed = await processEmails(store, cfg, new Date(), fetch, participant.id);
          emailState = processed.find(j => j.kind === 'confirmation')?.state || 'pending';
        } catch { /* La tâche reste consultable par l’organisateur. */ }
        return json(res, 201, { reference: participant.id, email_state: emailState });
      }
      if (req.method === 'POST' && path === '/api/login') {
        limit(req, 'login', 8);
        const input = await body(req);
        if (typeof input.email !== 'string' || typeof input.password !== 'string' || input.email.length > 254 || input.password.length > 256) throw new HttpError(401, 'Identifiants incorrects.');
        const result = await store.login(input.email.trim(), input.password);
        res.setHeader('Set-Cookie', cookie(result.value)); return json(res, 200, { user: result.user });
      }
      if (req.method === 'POST' && path === '/api/logout') {
        await store.logout(session(req)); res.setHeader('Set-Cookie', cookie('', 0)); return json(res, 200, { ok: true });
      }
      const protectedPath = /^\/api\/(me|participants|scores|ranking|emails)(\/|$)/.test(path);
      if (!protectedPath) throw new HttpError(404, 'Page ou action introuvable.');
      const user = await store.user(session(req));
      if (!user) throw new HttpError(401, 'Connectez-vous à l’espace équipe.');
      if (!['organizer', 'jury'].includes(user.role)) throw new HttpError(403, 'Accès refusé.');
      if (req.method === 'GET' && path === '/api/me') return json(res, 200, { user });
      if (req.method === 'GET' && path === '/api/participants') {
        const rows = await store.listParticipants();
        return json(res, 200, { participants: user.role === 'jury' ? rows.map(({ email, ...p }) => p) : rows });
      }
      if (req.method === 'GET' && path === '/api/ranking') return json(res, 200, { ranking: ranking(await store.listParticipants()) });
      if (req.method === 'GET' && path === '/api/emails') {
        if (user.role !== 'organizer') throw new HttpError(403, 'Cette fonction est réservée à l’organisateur.');
        return json(res, 200, { emails: await store.listEmails() });
      }
      const participantMatch = path.match(/^\/api\/participants\/([0-9a-f-]{36})$/);
      if (req.method === 'PATCH' && participantMatch) {
        if (user.role !== 'organizer') throw new HttpError(403, 'Cette fonction est réservée à l’organisateur.');
        const input = await body(req);
        if (!['registered', 'withdrawn'].includes(input.status)) throw new HttpError(422, 'Statut invalide.');
        await store.updateStatus(participantMatch[1], input.status); return json(res, 200, { ok: true });
      }
      const scoreMatch = path.match(/^\/api\/scores\/([0-9a-f-]{36})$/);
      if (req.method === 'PUT' && scoreMatch) {
        if (user.role !== 'jury') throw new HttpError(403, 'Seul le jury peut modifier les notes.');
        await store.saveScores(scoreMatch[1], scoresInput(await body(req)), user); return json(res, 200, { ok: true });
      }
      throw new HttpError(404, 'Action introuvable.');
    } catch (error) {
      if (!error.status) console.error('Erreur serveur', error.name); // Ne journaliser ni secret ni corps de requête.
      if (!res.headersSent) return json(res, error.status || 503, { error: error.status ? error.message : 'Service temporairement indisponible. Réessayez plus tard.', ...(error.fields ? { fields: error.fields } : {}) });
      res.end();
    }
  };
}
