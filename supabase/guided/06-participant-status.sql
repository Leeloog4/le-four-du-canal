-- Étape gestion des inscrits. Les tâches d’e-mail ne sont pas encore créées.
begin;

create function public.set_participant_status(
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

  update public.participants
  set status = p_status
  where id = p_id;

  if not found then
    raise no_data_found using message = 'Participant introuvable';
  end if;
end;
$$;

revoke all on function public.set_participant_status(uuid, text)
from public, anon, authenticated;

grant execute on function public.set_participant_status(uuid, text)
to service_role;

commit;
