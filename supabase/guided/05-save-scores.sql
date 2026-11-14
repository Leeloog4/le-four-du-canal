begin;

create function public.save_scores(
  p_id uuid,
  p_jury uuid,
  p_taste integer,
  p_texture integer,
  p_presentation integer
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_status text;
begin
  if not exists (
    select 1 from public.team_users
    where id = p_jury and role = 'jury'
  ) then
    raise exception 'Rôle jury requis' using errcode = '42501';
  end if;

  select status into current_status
  from public.participants
  where id = p_id
  for update;

  if not found then
    raise no_data_found using message = 'Participant introuvable';
  end if;

  if current_status <> 'registered' then
    raise exception 'Participation retirée';
  end if;

  insert into public.scores (
    participant_id, jury_id, taste, texture, presentation
  ) values (
    p_id, p_jury, p_taste, p_texture, p_presentation
  )
  on conflict (participant_id) do update set
    jury_id = excluded.jury_id,
    taste = excluded.taste,
    texture = excluded.texture,
    presentation = excluded.presentation,
    updated_at = now();
end;
$$;

revoke all on function public.save_scores(uuid, uuid, integer, integer, integer)
from public, anon, authenticated;

grant execute on function public.save_scores(uuid, uuid, integer, integer, integer)
to service_role;

commit;
