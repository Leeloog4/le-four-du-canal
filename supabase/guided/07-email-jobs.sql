-- Créer l’historique et la file d’attente, sans envoi ni ajout de messages.
begin;

create table public.email_jobs (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id),
  recipient text not null,
  kind text not null check (kind in ('confirmation', 'reminder')),
  subject text not null,
  content text not null,
  due_at timestamptz not null,
  state text not null check (
    state in (
      'pending', 'processing', 'simulated',
      'accepted', 'failed', 'uncertain', 'skipped'
    )
  ),
  attempts integer not null default 0,
  message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (participant_id, kind)
);

create index email_due on public.email_jobs(state, due_at);

alter table public.email_jobs enable row level security;
revoke all on public.email_jobs from anon, authenticated;
grant all on public.email_jobs to service_role;

commit;
