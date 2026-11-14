export async function processEmails(store, cfg, now = new Date(), fetcher = fetch, participantId = null) {
  const jobs = await store.claimEmails(now.toISOString(), participantId);
  const result = [];
  for (const job of jobs) {
    let outcome;
    if (job.kind === 'reminder' && now >= new Date(cfg.eventAt)) outcome = { state: 'skipped', message_id: null, last_error: 'Événement passé : aucun rappel envoyé en retard.' };
    else if (cfg.emailMode === 'simulated') outcome = { state: 'simulated', message_id: null, last_error: null };
    else {
      try {
        const response = await fetcher('https://api.brevo.com/v3/smtp/email', {
          method: 'POST', headers: { 'api-key': cfg.brevoKey, 'Content-Type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ sender: { name: cfg.senderName, email: cfg.senderEmail }, to: [{ email: job.recipient }], subject: job.subject, textContent: job.content }),
          signal: AbortSignal.timeout(8000)
        });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.messageId) outcome = { state: 'accepted', message_id: String(data.messageId), last_error: null };
        else if (response.ok || response.status >= 500) outcome = { state: 'uncertain', message_id: null, last_error: 'Résultat Brevo incertain : vérifier le journal fournisseur avant toute reprise.' };
        else outcome = { state: 'failed', message_id: null, last_error: `Brevo a refusé la demande (HTTP ${response.status}).` };
      } catch {
        outcome = { state: 'uncertain', message_id: null, last_error: 'Connexion Brevo interrompue : livraison inconnue, vérifier avant toute reprise.' };
      }
    }
    await store.finishEmail(job.id, outcome);
    result.push({ id: job.id, participant_id: job.participant_id, kind: job.kind, state: outcome.state });
  }
  return result;
}
