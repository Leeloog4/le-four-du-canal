-- Étape guidée : la table participants existe déjà, team_users n’a pas encore été créée.
-- À exécuter une seule fois dans l’éditeur SQL Supabase.
begin;

create table public.team_users (
  id uuid primary key references auth.users(id),
  role text not null check (role in ('organizer', 'jury'))
);

alter table public.team_users enable row level security;
revoke all on public.team_users from anon, authenticated;
grant all on public.team_users to service_role;

insert into public.team_users (id, role)
values ('6c47adac-7fc9-41be-beaa-11b7717dbba6', 'organizer');

commit;

select id, role
from public.team_users
where id = '6c47adac-7fc9-41be-beaa-11b7717dbba6';
