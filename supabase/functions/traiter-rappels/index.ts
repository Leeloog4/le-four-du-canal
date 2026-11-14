// Appel serveur uniquement. Déploiement inactif tant que REMINDERS_ENABLED != true.
async function traiterRappels(request) {
  const reply = (status, data) => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
  if (request.method !== 'POST') return reply(405, { error: 'Méthode non autorisée.' });
  const secret = Deno.env.get('REMINDERS_CRON_SECRET');
  if (!secret || secret.length < 32) return reply(503, { error: 'Secret du planificateur non configuré.' });
  if (request.headers.get('x-cron-secret') !== secret) return reply(401, { error: 'Accès refusé.' });
  if (Deno.env.get('REMINDERS_ENABLED') !== 'true') return reply(200, { enabled: false, processed: 0 });
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const brevo = Deno.env.get('BREVO_API_KEY');
  const sender = Deno.env.get('BREVO_SENDER_EMAIL');
  const eventAt = new Date(Deno.env.get('EVENT_AT') || '2026-12-04T14:00:00.000Z');
  if (!url || !key || !brevo || !sender || !Number.isFinite(eventAt.getTime())) {
    return reply(503, { error: 'Configuration serveur incomplète.' });
  }
  const db = (path, method = 'GET', body) => fetch(url + '/rest/v1' + path, {
    method, headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(8000)
  });
  const counts = { processed: 0, accepted: 0, failed: 0, uncertain: 0, skipped: 0, simulated: 0 };
  try {
    // La RPC utilise l’horloge PostgreSQL, sélectionne uniquement les rappels dus
    // et réserve au plus deux tâches avec SKIP LOCKED, sans reprise automatique.
    const claimed = await db('/rpc/claim_reminders', 'POST', { p_event_at: eventAt.toISOString() });
    if (!claimed.ok) return reply(503, { error: 'Réclamation des rappels indisponible.' });
    const jobs = await claimed.json();
    if (!Array.isArray(jobs)) throw new Error('Réponse de réclamation invalide');
    for (const job of jobs) {
      let result;
      // Relecture avant chaque appel fournisseur, notamment après un retrait.
      const participant = await db('/participants?select=status&id=eq.' + encodeURIComponent(job.participant_id));
      if (!participant.ok) throw new Error('Vérification du participant indisponible');
      const rows = await participant.json();
      const domain = typeof job.recipient === 'string' ? job.recipient.split('@')[1] : '';
      const fictitious = /(^|\.)(test|invalid|example|localhost)$/.test(domain || '')
        || ['example.com', 'example.net', 'example.org'].some(value => domain === value || domain?.endsWith('.' + value));
      if (rows[0]?.status !== 'registered' || new Date() >= eventAt) {
        result = { state: 'skipped', message_id: null, last_error: 'Participation retirée ou événement passé.' };
      } else if (fictitious) {
        result = { state: 'simulated', message_id: null, last_error: 'Adresse fictive : aucun envoi réel.' };
      } else if (job.kind !== 'reminder' || !domain || !job.subject || !job.content) {
        result = { state: 'failed', message_id: null, last_error: 'Tâche de rappel invalide.' };
      } else {
        try {
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST', headers: { 'api-key': brevo, 'Content-Type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ sender: { email: sender, name: Deno.env.get('BREVO_SENDER_NAME') || 'Le Four du Canal' },
              to: [{ email: job.recipient }], subject: job.subject, textContent: job.content }),
            signal: AbortSignal.timeout(8000)
          });
          const data = await response.json().catch(() => null);
          result = response.ok && typeof data?.messageId === 'string' && data.messageId
            ? { state: 'accepted', message_id: data.messageId, last_error: null }
            : { state: response.ok || response.status >= 500 ? 'uncertain' : 'failed', message_id: null,
              last_error: `Réponse Brevo HTTP ${response.status} : vérifier le journal avant toute reprise.` };
        } catch {
          result = { state: 'uncertain', message_id: null, last_error: 'Réponse Brevo interrompue : vérifier avant toute reprise.' };
        }
      }
      const saved = await db('/email_jobs?id=eq.' + encodeURIComponent(job.id) + '&state=eq.processing', 'PATCH', {
        ...result, processed_at: new Date().toISOString()
      });
      if (!saved.ok) return reply(503, { error: 'Résultat non enregistré : vérifier les tâches processing et le journal Brevo avant toute reprise.' });
      counts.processed++; counts[result.state]++;
    }
    return reply(200, { enabled: true, ...counts });
  } catch {
    return reply(503, { error: 'Traitement interrompu : vérifier les tâches processing avant toute reprise.' });
  }
}
Deno.serve(traiterRappels);
