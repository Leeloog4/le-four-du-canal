-- Recette uniquement : crée un nouveau participant fictif et deux tâches.
-- Ne modifie aucune inscription existante et ne fait aucun appel Brevo.
-- La fonction traiter-rappels doit être active ; Cron traitera le rappel dû.
-- L’adresse réservée .test impose la simulation côté fonction.
begin;
do $$
declare
  test_id uuid := gen_random_uuid();
begin
  if exists (select 1 from public.participants where email = 'recette-rappel-cron@example.test') then
    raise exception 'Ce test existe déjà. Consulter son résultat avec le script 12, sans le recréer.';
  end if;
  perform public.register_participant(
    jsonb_build_object(
      'id', test_id, 'first_name', 'Test Cron', 'last_name', 'Fictif',
      'email', 'recette-rappel-cron@example.test'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'kind', 'confirmation', 'due_at', now(), 'state', 'simulated',
        'subject', '[RECETTE SIMULÉE] Confirmation',
        'content', 'Participant fictif de recette : aucun envoi réel.',
        'last_error', 'Confirmation simulée à la création de la recette.'
      ),
      jsonb_build_object(
        'kind', 'reminder', 'due_at', now() - interval '1 minute', 'state', 'pending',
        'subject', '[RECETTE SIMULÉE] Rappel Cron',
        'content', 'Rappel fictif dû pour vérifier le planificateur sans envoi réel.',
        'last_error', null
      )
    )
  );
end;
$$;
commit;
