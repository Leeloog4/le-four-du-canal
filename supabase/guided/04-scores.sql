-- Étape guidée : participants et team_users existent ; scores n’existe pas encore.
begin;

create table public.scores (
  participant_id uuid primary key references public.participants(id),
  jury_id uuid not null references public.team_users(id),
  taste integer not null check (taste between 0 and 10),
  texture integer not null check (texture between 0 and 10),
  presentation integer not null check (presentation between 0 and 10),
  updated_at timestamptz not null default now()
);

alter table public.scores enable row level security;
revoke all on public.scores from anon, authenticated;
grant all on public.scores to service_role;

commit;
