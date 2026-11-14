-- Lecture seule ; à exécuter après 1 à 2 minutes, puis une seconde fois.
-- Le rappel attendu : simulated, attempts = 1, message_id NULL,
-- processed_at renseigné et last_error indiquant une adresse fictive.
select message.kind, message.state, message.attempts, message.message_id,
       message.due_at, message.processed_at, message.last_error
from public.email_jobs as message
join public.participants as participant on participant.id = message.participant_id
where participant.email = 'recette-rappel-cron@example.test'
order by message.kind;
