const allowedOrigin = 'https://four-du-canal-exercice.leeloog4.chatgpt.site';

async function changerStatutParticipant(request) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Cache-Control': 'no-store', 'Vary': 'Origin'
  };
  const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
  if (request.headers.get('Origin') !== allowedOrigin) return reply(403, { error: 'Origine non autorisée.' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, { error: 'Méthode non autorisée.' });
  const authorization = request.headers.get('Authorization') || '';
  if (!/^Bearer \S+$/i.test(authorization)) return reply(401, { error: 'Connectez-vous avec le compte organisateur.' });
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415, { error: 'Format JSON requis.' });
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !serviceKey || !publicKey) return reply(503, { error: 'Configuration serveur incomplète.' });
    const identityResponse = await fetch(url + '/auth/v1/user', {
      headers: { apikey: publicKey, Authorization: authorization }, signal: AbortSignal.timeout(10000)
    });
    if ([401, 403].includes(identityResponse.status)) return reply(401, { error: 'Session expirée ou invalide. Reconnectez-vous.' });
    if (!identityResponse.ok) return reply(503, { error: 'Vérification du compte indisponible.' });
    const identity = await identityResponse.json();
    if (typeof identity.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(identity.id)) return reply(503, { error: 'Réponse de connexion invalide.' });
    const privateHeaders = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
    const roleResponse = await fetch(url + '/rest/v1/team_users?select=role&id=eq.' + encodeURIComponent(identity.id), {
      headers: privateHeaders, signal: AbortSignal.timeout(10000)
    });
    if (!roleResponse.ok) return reply(503, { error: 'Vérification des droits indisponible.' });
    const roles = await roleResponse.json();
    if (!Array.isArray(roles) || roles[0]?.role !== 'organizer') return reply(403, { error: 'Cette action est réservée à l’organisateur.' });
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 8192) return reply(413, { error: 'Demande trop volumineuse.' });
    let input;
    try { input = JSON.parse(text); } catch { return reply(400, { error: 'Données invalides.' }); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { error: 'Données invalides.' });
    if (typeof input.participant_id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.participant_id)) return reply(422, { error: 'Participant invalide.' });
    if (!['registered', 'withdrawn'].includes(input.status)) return reply(422, { error: 'Statut invalide.' });
    const response = await fetch(url + '/rest/v1/rpc/set_participant_status', {
      method: 'POST', headers: { ...privateHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_id: input.participant_id, p_status: input.status }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.code === 'P0002') return reply(404, { error: 'Participant introuvable.' });
      if (error.code === '22023') return reply(422, { error: 'Statut invalide.' });
      return reply(503, { error: 'Modification indisponible. Réessayez plus tard.' });
    }
    return reply(200, { message: 'Statut enregistré.', participant_id: input.participant_id, status: input.status });
  } catch {
    return reply(503, { error: 'Réponse interrompue. Actualisez la liste pour vérifier le statut avant de réessayer.' });
  }
}

Deno.serve(changerStatutParticipant);
