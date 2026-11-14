import { resolve } from 'node:path';

export function config(env = process.env) {
  const backend = env.DATA_BACKEND || 'sqlite';
  const emailMode = env.EMAIL_MODE || 'simulated';
  if (!['sqlite', 'supabase'].includes(backend)) throw new Error('DATA_BACKEND invalide');
  if (!['simulated', 'brevo'].includes(emailMode)) throw new Error('EMAIL_MODE invalide');
  const eventAt = env.EVENT_AT || '2026-12-04T14:00:00.000Z';
  if (!Number.isFinite(Date.parse(eventAt))) throw new Error('EVENT_AT doit être une date ISO valide');
  const origin = env.PUBLIC_ORIGIN || 'http://localhost:3000';
  if (new URL(origin).origin !== origin) throw new Error('PUBLIC_ORIGIN doit être une origine sans chemin');
  if (backend === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY)) throw new Error('Configuration Supabase incomplète');
  if (env.SUPABASE_URL && new URL(env.SUPABASE_URL).protocol !== 'https:') throw new Error('Supabase exige HTTPS');
  if (emailMode === 'brevo' && (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL)) throw new Error('Configuration Brevo incomplète');
  if (env.VERCEL && backend !== 'supabase') throw new Error('Vercel exige Supabase : SQLite local non persistant');
  return { backend, emailMode, origin, secure: new URL(origin).protocol === 'https:',
    demo: env.DEMO_MODE !== 'false', eventAt: new Date(eventAt).toISOString(), place: env.EVENT_PLACE || 'Atelier du Canal, 12 rue des Gourmands, 75010 Paris (lieu fictif)',
    databasePath: resolve(env.DATABASE_PATH || './data/concours.sqlite'),
    supabaseUrl: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    brevoKey: env.BREVO_API_KEY, senderEmail: env.BREVO_SENDER_EMAIL, senderName: env.BREVO_SENDER_NAME || 'Le Four du Canal',
    cronSecret: env.CRON_SECRET || '', host: env.HOST || '127.0.0.1', port: Number(env.PORT || 3000) };
}
