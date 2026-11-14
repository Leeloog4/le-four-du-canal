const allowedOrigin = 'https://four-du-canal-exercice.leeloog4.chatgpt.site';

async function consulterEmails(request) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };
  const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
  if (request.headers.get('Origin') !== allowedOrigin) return reply(403, { error: 'Origine non autorisée.' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') return reply(405, { error: 'Méthode non autorisée.' });
  const authorization = request.headers.get('Authorization') || '';
  if (!/^Bearer \S+$/i.test(authorization)) return reply(401, { error: 'Connectez-vous à l’espace équipe.' });

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !serviceKey || !publicKey) return reply(503, { error: 'Configuration serveur incomplète.' });

    // Vérifier le jeton auprès de Supabase Auth, sans se fier à son contenu décodé.
    const identityResponse = await fetch(url + '/auth/v1/user', {
      headers: { apikey: publicKey, Authorization: authorization },
      signal: AbortSignal.timeout(10000)
    });
    if ([401, 403].includes(identityResponse.status)) return reply(401, { error: 'Session expirée ou invalide. Reconnectez-vous.' });
    if (!identityResponse.ok) return reply(503, { error: 'Vérification du compte indisponible.' });
    const identity = await identityResponse.json();
    if (typeof identity.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(identity.id)) return reply(503, { error: 'Réponse du service de connexion invalide.' });

    const privateHeaders = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
    const roleResponse = await fetch(url + '/rest/v1/team_users?select=role&id=eq.' + encodeURIComponent(identity.id), {
      headers: privateHeaders, signal: AbortSignal.timeout(10000)
    });
    if (!roleResponse.ok) return reply(503, { error: 'Vérification des droits indisponible.' });
    const roles = await roleResponse.json();
    const role = Array.isArray(roles) ? roles[0]?.role : null;
    if (role !== 'organizer') return reply(403, { error: 'Cet historique est réservé à l’organisateur.' });

    const fields = 'id,participant_id,recipient,kind,subject,content,due_at,state,attempts,message_id,last_error,created_at,processed_at,participants(first_name,last_name,status)';
    const emails = [];
    for (let offset = 0; ; offset += 500) {
      const response = await fetch(url + '/rest/v1/email_jobs?select=' + fields + '&order=created_at.desc,id.asc', {
        headers: { ...privateHeaders, Range: `${offset}-${offset + 499}`, 'Range-Unit': 'items' },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) return reply(503, { error: 'Historique des e-mails indisponible.' });
      const rows = await response.json();
      if (!Array.isArray(rows)) return reply(503, { error: 'Réponse du service de données invalide.' });
      emails.push(...rows.map(row => {
        const participant = Array.isArray(row.participants) ? row.participants[0] : row.participants;
        return {
          id: row.id, participant_id: row.participant_id, recipient: row.recipient,
          kind: row.kind, subject: row.subject, content: row.content,
          due_at: row.due_at, state: row.state, attempts: row.attempts,
          message_id: row.message_id, last_error: row.last_error,
          created_at: row.created_at, processed_at: row.processed_at,
          participant: participant ? { first_name: participant.first_name, last_name: participant.last_name, status: participant.status } : null
        };
      }));
      if (rows.length < 500) break;
    }
    return reply(200, { emails });
  } catch {
    return reply(503, { error: 'Historique temporairement indisponible. Réessayez plus tard.' });
  }
}
Deno.serve(consulterEmails);
