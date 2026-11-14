const allowedOrigin = 'https://four-du-canal-exercice.leeloog4.chatgpt.site';

async function confirmerInscription(db, participantId, now) {
  let providerCalled = false;
  try {
    const key = Deno.env.get('BREVO_API_KEY');
    const sender = Deno.env.get('BREVO_SENDER_EMAIL');
    const name = Deno.env.get('BREVO_SENDER_NAME') || 'Le Four du Canal';
    if (!key || !sender) return 'pending';
    const claimed = await db('/rpc/claim_emails', 'POST', {
      p_now: now, p_participant: participantId
    });
    if (!claimed.ok) return 'pending';
    const jobs = await claimed.json();
    const job = Array.isArray(jobs) ? jobs.find(row => row.kind === 'confirmation') : null;
    if (!job) {
      const status = await db('/email_jobs?select=state&participant_id=eq.' + participantId + '&kind=eq.confirmation');
      const rows = status.ok ? await status.json() : [];
      return rows[0]?.state || 'pending';
    }
    let result;
    try {
      providerCalled = true;
      const sent = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { name, email: sender }, to: [{ email: job.recipient }], subject: job.subject, textContent: job.content }),
        signal: AbortSignal.timeout(8000)
      });
      const data = await sent.json().catch(() => null);
      if (sent.ok && typeof data?.messageId === 'string' && data.messageId) {
        result = { state: 'accepted', message_id: data.messageId, last_error: null };
      } else if (sent.ok || sent.status >= 500) {
        result = { state: 'uncertain', message_id: null, last_error: 'Résultat Brevo incertain : vérifier le journal avant toute reprise.' };
      } else {
        result = { state: 'failed', message_id: null, last_error: `Brevo a refusé la demande (HTTP ${sent.status}).` };
      }
    } catch {
      result = { state: 'uncertain', message_id: null, last_error: 'Réponse Brevo interrompue : vérifier avant toute reprise.' };
    }
    const saved = await db('/email_jobs?id=eq.' + encodeURIComponent(job.id), 'PATCH', {
      ...result, processed_at: new Date().toISOString()
    });
    return saved.ok ? result.state : 'uncertain';
  } catch {
    return providerCalled ? 'uncertain' : 'pending';
  }
}

async function inscrireParticipant(request) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
    'Cache-Control': 'no-store', 'Vary': 'Origin'
  };
  const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
  if (request.headers.get('Origin') !== allowedOrigin) return reply(403, { error: 'Origine non autorisée.' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, { error: 'Méthode non autorisée.' });
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415, { error: 'Format JSON requis.' });
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 8192) return reply(413, { error: 'Formulaire trop volumineux.' });
    let input;
    try { input = JSON.parse(text); } catch { return reply(400, { error: 'Formulaire invalide.' }); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { error: 'Formulaire invalide.' });
    const first_name = typeof input.first_name === 'string' ? input.first_name.trim().normalize('NFC') : '';
    const last_name = typeof input.last_name === 'string' ? input.last_name.trim().normalize('NFC') : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const validName = value => value.length > 0 && value.length <= 80 && !/[\u0000-\u001f\u007f<>]/.test(value);
    if (input.website || !validName(first_name) || !validName(last_name) || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
      return reply(422, { error: 'Vérifiez le prénom, le nom et l’adresse e-mail.' });
    }
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return reply(503, { error: 'Configuration serveur incomplète.' });
    const db = (path, method = 'GET', body) => fetch(url + '/rest/v1' + path, {
      method, headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(8000)
    });
    const eventAt = new Date(Deno.env.get('EVENT_AT') || '2026-12-04T14:00:00.000Z');
    if (!Number.isFinite(eventAt.getTime())) return reply(503, { error: 'Date du concours invalide.' });
    const place = Deno.env.get('EVENT_PLACE') || 'Atelier du Canal, 12 rue des Gourmands, 75010 Paris (lieu fictif)';
    const eventText = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(eventAt);
    const now = new Date();
    const reminderAt = new Date(eventAt.getTime() - 24 * 3600000);
    const domain = email.split('@')[1];
    const fictitious = /(^|\.)(test|invalid|example|localhost)$/.test(domain)
      || ['example.com', 'example.net', 'example.org'].some(value => domain === value || domain.endsWith('.' + value));
    const id = crypto.randomUUID();
    const jobs = [
      {
        kind: 'confirmation', due_at: now.toISOString(), state: fictitious ? 'simulated' : 'pending',
        last_error: fictitious ? 'Adresse fictive : aucun envoi réel.' : null,
        subject: '[DÉMONSTRATION] Votre inscription au Four du Canal',
        content: `Bonjour ${first_name},\n\nVotre participation au concours amateur de pâtisserie est enregistrée.\nDate fictive de l’exercice : ${eventText} (Paris).\n${place}.\n\nCe message appartient à un prototype de démonstration.\nLe Four du Canal`
      },
      {
        kind: 'reminder', due_at: reminderAt.toISOString(),
        state: reminderAt <= now ? 'skipped' : fictitious ? 'simulated' : 'pending',
        last_error: reminderAt <= now ? 'Inscription après l’heure du rappel : aucun rappel rétroactif.' : fictitious ? 'Adresse fictive : aucun envoi réel.' : null,
        subject: '[DÉMONSTRATION] Rappel du concours du Four du Canal',
        content: `Bonjour ${first_name},\n\nLe concours de pâtisserie approche.\nDate fictive de l’exercice : ${eventText} (Paris).\n${place}.\n\nCe message appartient à un prototype de démonstration.\nLe Four du Canal`
      }
    ];
    const registered = await db('/rpc/register_participant', 'POST', {
      p_participant: { id, first_name, last_name, email }, p_jobs: jobs
    });
    if (!registered.ok) {
      const detail = await registered.json().catch(() => ({}));
      if (detail.code === '23505') return reply(409, { error: 'Cette adresse possède déjà une inscription.' });
      return reply(503, { error: 'Enregistrement indisponible. Réessayez plus tard.' });
    }
    // L’inscription est acquise : une panne e-mail ne doit pas la faire échouer.
    const emailState = fictitious ? 'simulated' : await confirmerInscription(db, id, now.toISOString());
    return reply(201, { reference: id, email_state: emailState, reminder_state: jobs[1].state });
  } catch {
    return reply(503, { error: 'Connexion interrompue. Réessayez avec la même adresse ; elle ne sera pas inscrite deux fois.' });
  }
}

Deno.serve(inscrireParticipant);
