const allowedOrigin = 'https://four-du-canal-exercice.leeloog4.chatgpt.site';

async function envoyerEmailTest(request) {
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
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !serviceKey || !publicKey) return reply(503, { error: 'Configuration Supabase incomplète.' });
    const identityResponse = await fetch(url + '/auth/v1/user', {
      headers: { apikey: publicKey, Authorization: authorization }, signal: AbortSignal.timeout(10000)
    });
    if ([401, 403].includes(identityResponse.status)) return reply(401, { error: 'Session expirée ou invalide. Reconnectez-vous.' });
    if (!identityResponse.ok) return reply(503, { error: 'Vérification du compte indisponible.' });
    const identity = await identityResponse.json();
    if (typeof identity.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(identity.id)) return reply(503, { error: 'Réponse de connexion invalide.' });
    const roleResponse = await fetch(url + '/rest/v1/team_users?select=role&id=eq.' + encodeURIComponent(identity.id), {
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }, signal: AbortSignal.timeout(10000)
    });
    if (!roleResponse.ok) return reply(503, { error: 'Vérification des droits indisponible.' });
    const roles = await roleResponse.json();
    if (!Array.isArray(roles) || roles[0]?.role !== 'organizer') return reply(403, { error: 'Le test e-mail est réservé à l’organisateur.' });

    const brevoKey = Deno.env.get('BREVO_API_KEY');
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL');
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Le Four du Canal';
    const recipient = Deno.env.get('BREVO_TEST_RECIPIENT');
    const validEmail = value => typeof value === 'string' && value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
    if (!brevoKey || !validEmail(senderEmail) || !validEmail(recipient)) return reply(503, { error: 'Vérifiez les secrets BREVO_API_KEY, BREVO_SENDER_EMAIL et BREVO_TEST_RECIPIENT.' });

    // Le destinataire vient du secret serveur, jamais du formulaire ou du corps de requête.
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST', headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: recipient }],
          subject: '[TEST] Le Four du Canal — vérification e-mail',
          textContent: 'Bonjour,\n\nCeci est un message de test du projet Le Four du Canal.\nIl permet de vérifier la réception des e-mails avant leur activation pour le concours.\nCe message ne constitue pas une inscription.\n\nLe Four du Canal'
        }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await response.json().catch(() => null);
      if (response.ok && typeof data?.messageId === 'string' && data.messageId) return reply(200, {
        state: 'accepted', message_id: data.messageId,
        message: 'Brevo a accepté le message de test. Vérifiez votre boîte de réception et les courriers indésirables.'
      });
      if (response.ok || response.status >= 500) return reply(502, { state: 'uncertain', error: 'Résultat Brevo incertain. Vérifiez votre boîte et le journal Brevo avant de retenter.' });
      return reply(502, { state: 'failed', error: `Brevo a refusé la demande (HTTP ${response.status}). Vérifiez la clé API, l’expéditeur et l’activation des e-mails transactionnels.` });
    } catch {
      return reply(502, { state: 'uncertain', error: 'Connexion à Brevo interrompue. Vérifiez votre boîte et le journal Brevo avant de retenter.' });
    }
  } catch {
    return reply(503, { error: 'Vérification du compte indisponible. Réessayez plus tard.' });
  }
}

Deno.serve(envoyerEmailTest);
