-- Prérequis : participants et email_jobs existent. Aucun message créé ou envoyé ici.
begin;

create function public.register_participant(
  p_participant jsonb,
  p_jobs jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  participant_uuid uuid;
begin
  participant_uuid := (p_participant->>'id')::uuid;

  if jsonb_typeof(p_jobs) is distinct from 'array' then
    raise exception 'Liste de messages invalide' using errcode = '22023';
  end if;
  if jsonb_array_length(p_jobs) <> 2 then
    raise exception 'Deux messages sont nécessaires' using errcode = '22023';
  end if;

  insert into public.participants (id, first_name, last_name, email)
  values (
    participant_uuid,
    p_participant->>'first_name',
    p_participant->>'last_name',
    p_participant->>'email'
  );

  insert into public.email_jobs (
    participant_id, recipient, kind, subject,
    content, due_at, state, last_error
  )
  select
    participant_uuid,
    p_participant->>'email',
    message->>'kind',
    message->>'subject',
    message->>'content',
    (message->>'due_at')::timestamptz,
    message->>'state',
    message->>'last_error'
  from jsonb_array_elements(p_jobs) as message;

  return participant_uuid;
end;
$$;

create function public.claim_emails(
  p_now timestamptz,
  p_participant uuid default null
) returns setof public.email_jobs
language sql
security invoker
set search_path = public
as $$
  update public.email_jobs
  set state = 'processing',
      attempts = attempts + 1,
      processed_at = p_now
  where id in (
    select message.id
    from public.email_jobs as message
    join public.participants as participant
      on participant.id = message.participant_id
    where message.state = 'pending'
      and message.due_at <= p_now
      and participant.status = 'registered'
      and (
        p_participant is null
        or message.participant_id = p_participant
      )
    order by message.due_at, message.id
    limit 2
    for update of message skip locked
  )
  returning *;
$$;

create or replace function public.set_participant_status(
  p_id uuid,
  p_status text
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_status is null or p_status not in ('registered', 'withdrawn') then
    raise exception 'Statut invalide' using errcode = '22023';
  end if;

  update public.participants set status = p_status where id = p_id;
  if not found then
    raise no_data_found using message = 'Participant introuvable';
  end if;

  if p_status = 'withdrawn' then
    update public.email_jobs
    set state = 'skipped', last_error = 'Participation retirée'
    where participant_id = p_id and state = 'pending';
  end if;
end;
$$;

revoke all on function public.register_participant(jsonb, jsonb)
from public, anon, authenticated;
revoke all on function public.claim_emails(timestamptz, uuid)
from public, anon, authenticated;
revoke all on function public.set_participant_status(uuid, text)
from public, anon, authenticated;

grant execute on function public.register_participant(jsonb, jsonb)
to service_role;
grant execute on function public.claim_emails(timestamptz, uuid)
to service_role;
grant execute on function public.set_participant_status(uuid, text)
to service_role;

commit;
