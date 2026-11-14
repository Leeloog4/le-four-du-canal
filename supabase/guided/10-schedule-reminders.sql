-- Prérequis : Cron installé ; fonction traiter-rappels déployée, JWT hérité désactivé.
-- Vault contient reminders_cron_secret, identique au secret de la fonction.
-- Garder REMINDERS_ENABLED absent ou false pendant cette vérification.
-- Ce script crée une tâche active, sans activer les envois dans la fonction.
begin;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if (select count(*) from vault.decrypted_secrets
      where name = 'reminders_cron_secret' and length(decrypted_secret) >= 32) <> 1 then
    raise exception 'Créer un unique secret Vault reminders_cron_secret de 32 caractères minimum.';
  end if;
  if exists (select 1 from cron.job where jobname = 'four-du-canal-rappels') then
    raise exception 'La tâche four-du-canal-rappels existe déjà : ne pas la créer une seconde fois.';
  end if;
end;
$$;

select cron.schedule(
  'four-du-canal-rappels',
  '* * * * *',
  $command$
    select net.http_post(
      url := 'https://xeeixhbhfsdxrgeotlix.supabase.co/functions/v1/traiter-rappels',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'reminders_cron_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $command$
);
commit;
