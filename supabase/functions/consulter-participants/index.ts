const allowedOrigin = 'https://four-du-canal-exercice.leeloog4.chatgpt.site';

async function consulterParticipants(request) {
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
    if (!['organizer', 'jury'].includes(role)) return reply(403, { error: 'Ce compte ne possède pas d’accès à l’équipe.' });

    const fields = role === 'organizer'
      ? 'id,first_name,last_name,email,status,created_at,scores(taste,texture,presentation,updated_at)'
      : 'id,first_name,last_name,status,created_at,scores(taste,texture,presentation,updated_at)';
    const statusFilter = role === 'jury' ? '&status=eq.registered' : '';
    const participants = [];
    for (let offset = 0; ; offset += 500) {
      const response = await fetch(url + '/rest/v1/participants?select=' + fields + statusFilter + '&order=created_at.desc,id.asc', {
        headers: { ...privateHeaders, Range: `${offset}-${offset + 499}`, 'Range-Unit': 'items' },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) return reply(503, { error: 'Liste des participants indisponible.' });
      const rows = await response.json();
      if (!Array.isArray(rows)) return reply(503, { error: 'Réponse du service de données invalide.' });
      participants.push(...rows.filter(row => role === 'organizer' || row.status === 'registered').map(row => {
        const rawScores = Array.isArray(row.scores) ? row.scores[0] : row.scores;
        const scores = rawScores ? {
          taste: rawScores.taste, texture: rawScores.texture,
          presentation: rawScores.presentation, updated_at: rawScores.updated_at
        } : null;
        const participant = {
          id: row.id, first_name: row.first_name, last_name: row.last_name,
          status: row.status, created_at: row.created_at, scores
        };
        if (role === 'organizer') participant.email = row.email;
        return participant;
      }));
      if (rows.length < 500) break;
    }
    return reply(200, { user: { id: identity.id, email: identity.email, role }, participants });
  } catch {
    return reply(503, { error: 'Service temporairement indisponible. Réessayez plus tard.' });
  }
}

Deno.serve(consulterParticipants);
