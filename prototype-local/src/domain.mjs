export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function registrationInput(input) {
  const errors = {};
  const result = {};
  for (const key of ['first_name', 'last_name']) {
    const value = typeof input[key] === 'string' ? input[key].trim().normalize('NFC') : '';
    if (!value || value.length > 80 || /[\u0000-\u001f\u007f<>]/.test(value)) errors[key] = 'Saisissez un nom de 1 à 80 caractères, sans balises.';
    result[key] = value;
  }
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) errors.email = 'Saisissez une adresse e-mail valide.';
  if (Object.keys(errors).length) { const err = new HttpError(422, 'Vérifiez les champs indiqués.'); err.fields = errors; throw err; }
  return { ...result, email };
}
export function scoresInput(input) {
  const values = ['taste', 'texture', 'presentation'].map(key => input[key]);
  if (values.some(v => typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 10)) throw new HttpError(422, 'Les trois notes doivent être des entiers compris entre 0 et 10.');
  return Object.fromEntries(['taste', 'texture', 'presentation'].map((key, i) => [key, values[i]]));
}
export function ranking(participants) {
  const rows = participants.filter(p => p.status === 'registered' && p.scores)
    .map(p => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, ...p.scores,
      total: p.scores.taste + p.scores.texture + p.scores.presentation }))
    .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id));
  let rank = 0;
  return rows.map((p, i) => { if (!i || p.total !== rows[i - 1].total) rank = i + 1;
    return { ...p, rank, tied: rows.filter(q => q.total === p.total).length > 1 }; });
}
export function emailJobs(participant, cfg, now = new Date()) {
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(cfg.eventAt));
  const prefix = cfg.demo ? '[DÉMONSTRATION] ' : '';
  const due = new Date(Date.parse(cfg.eventAt) - 24 * 3600_000);
  const common = { participant_id: participant.id, recipient: participant.email, attempts: 0 };
  return [
    { ...common, kind: 'confirmation', due_at: now.toISOString(), state: 'pending',
      subject: prefix + 'Votre inscription au concours est enregistrée',
      content: `Bonjour ${participant.first_name},\n\nVotre inscription au concours amateur de pâtisserie du Four du Canal est enregistrée.\n${cfg.demo ? 'Ceci est un prototype. La date suivante est fictive.\n' : ''}${date} (heure de Paris).\n${cfg.place}.\n\nL’équipe du Four du Canal` },
    { ...common, kind: 'reminder', due_at: due.toISOString(), state: due > now ? 'pending' : 'skipped',
      last_error: due > now ? null : 'Inscription après l’heure du rappel : aucun rappel rétroactif.',
      subject: prefix + 'Rappel de votre concours de pâtisserie',
      content: `Bonjour ${participant.first_name},\n\nVotre concours de pâtisserie approche : ${date} (heure de Paris).\n${cfg.place}.\n${cfg.demo ? 'Date fictive — message de démonstration.\n' : ''}\nÀ bientôt,\nL’équipe du Four du Canal` }
  ];
}
