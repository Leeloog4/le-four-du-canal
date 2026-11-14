-- À appliquer une seule fois après 08-email-workflow.sql.
-- Aucun e-mail envoyé, aucun planificateur créé par ce script.
begin;
create function public.claim_reminders(p_event_at timestamptz)
returns setof public.email_jobs
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_event_at is null then
    raise exception 'Date du concours requise' using errcode = '22023';
  end if;
  update public.email_jobs as message
  set state = 'skipped', last_error = 'Participation retirée ou événement passé.', processed_at = now()
  where message.kind = 'reminder' and message.state = 'pending'
    and (now() >= p_event_at or exists (
      select 1 from public.participants as participant
      where participant.id = message.participant_id and participant.status = 'withdrawn'
    ));

  return query
  update public.email_jobs
  set state = 'processing', attempts = attempts + 1, processed_at = now()
  where id in (
    select message.id
    from public.email_jobs as message
    join public.participants as participant on participant.id = message.participant_id
    where message.kind = 'reminder' and message.state = 'pending'
      and message.due_at <= now() and now() < p_event_at
      and participant.status = 'registered'
    order by message.due_at, message.id
    limit 2
    for update of message skip locked
  )
  returning *;
end;
$$;
revoke all on function public.claim_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.claim_reminders(timestamptz) to service_role;
commit;
