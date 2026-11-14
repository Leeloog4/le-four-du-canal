-- À appliquer UNE fois dans un projet Supabase vide. Aucun compte ni donnée métier ajouté.
begin;
create table public.participants (
  id uuid primary key, first_name text not null check(char_length(first_name) between 1 and 80),
  last_name text not null check(char_length(last_name) between 1 and 80),
  email text not null unique check(email=lower(btrim(email))),
  status text not null default 'registered' check(status in ('registered','withdrawn')),
  created_at timestamptz not null default now()
);
create table public.team_users (
  id uuid primary key references auth.users(id),
  role text not null check(role in ('organizer','jury'))
);
create table public.scores (
  participant_id uuid primary key references public.participants(id),
  jury_id uuid not null references public.team_users(id),
  taste integer not null check(taste between 0 and 10),
  texture integer not null check(texture between 0 and 10),
  presentation integer not null check(presentation between 0 and 10),
  updated_at timestamptz not null default now()
);
create table public.email_jobs (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id),
  recipient text not null, kind text not null check(kind in ('confirmation','reminder')),
  subject text not null, content text not null, due_at timestamptz not null,
  state text not null check(state in ('pending','processing','simulated','accepted','failed','uncertain','skipped')),
  attempts integer not null default 0, message_id text, last_error text, processed_at timestamptz,
  unique(participant_id,kind)
);
create index email_due on public.email_jobs(state,due_at);

alter table public.participants enable row level security;
alter table public.team_users enable row level security;
alter table public.scores enable row level security;
alter table public.email_jobs enable row level security;
-- Toutes les données passent par le serveur. Aucune lecture/écriture directe anonyme
-- ou authentifiée ; le serveur vérifie l’identité Supabase et le rôle à chaque requête.
revoke all on public.participants,public.team_users,public.scores,public.email_jobs from anon,authenticated;
grant all on public.participants,public.team_users,public.scores,public.email_jobs to service_role;

create function public.register_participant(p_participant jsonb,p_jobs jsonb) returns uuid
language plpgsql security invoker set search_path=public as $$
declare result uuid;
begin
  result := (p_participant->>'id')::uuid;
  insert into public.participants(id,first_name,last_name,email,created_at)
  values(result,p_participant->>'first_name',p_participant->>'last_name',p_participant->>'email',(p_participant->>'created_at')::timestamptz);
  insert into public.email_jobs(participant_id,recipient,kind,subject,content,due_at,state,last_error)
  select result,j->>'recipient',j->>'kind',j->>'subject',j->>'content',(j->>'due_at')::timestamptz,j->>'state',j->>'last_error'
  from jsonb_array_elements(p_jobs) j;
  return result;
end $$;

create function public.set_participant_status(p_id uuid,p_status text) returns void
language plpgsql security invoker set search_path=public as $$
begin
  perform 1 from public.participants where id=p_id for update;
  if not found then raise no_data_found using message='Participant introuvable'; end if;
  update public.participants set status=p_status where id=p_id;
  if p_status='withdrawn' then
    update public.email_jobs set state='skipped',last_error='Participation retirée' where participant_id=p_id and state='pending';
  end if;
end $$;

create function public.save_scores(p_id uuid,p_jury uuid,p_taste integer,p_texture integer,p_presentation integer) returns void
language plpgsql security invoker set search_path=public as $$
declare current_status text;
begin
  select status into current_status from public.participants where id=p_id for update;
  if not found then raise no_data_found using message='Participant introuvable'; end if;
  if current_status<>'registered' then raise exception 'Participation retirée'; end if;
  if not exists(select 1 from public.team_users where id=p_jury and role='jury') then raise exception 'Rôle jury requis'; end if;
  insert into public.scores(participant_id,jury_id,taste,texture,presentation)
  values(p_id,p_jury,p_taste,p_texture,p_presentation)
  on conflict(participant_id) do update set jury_id=excluded.jury_id,taste=excluded.taste,texture=excluded.texture,presentation=excluded.presentation,updated_at=now();
end $$;

create function public.claim_emails(p_now timestamptz,p_participant uuid default null) returns setof public.email_jobs
language sql security invoker set search_path=public as $$
  update public.email_jobs set state='processing',attempts=attempts+1,processed_at=p_now
  where id in (
    select j.id from public.email_jobs j join public.participants p on p.id=j.participant_id
    where j.state='pending' and j.due_at<=p_now and p.status='registered' and (p_participant is null or j.participant_id=p_participant)
    order by j.due_at limit 2 for update of j skip locked
  ) returning *;
$$;

revoke all on function public.register_participant(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.set_participant_status(uuid,text) from public,anon,authenticated;
revoke all on function public.save_scores(uuid,uuid,integer,integer,integer) from public,anon,authenticated;
revoke all on function public.claim_emails(timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.register_participant(jsonb,jsonb) to service_role;
grant execute on function public.set_participant_status(uuid,text) to service_role;
grant execute on function public.save_scores(uuid,uuid,integer,integer,integer) to service_role;
grant execute on function public.claim_emails(timestamptz,uuid) to service_role;
commit;
