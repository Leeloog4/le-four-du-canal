-- Le compte Auth est créé par l’utilisateur ; team_users existe déjà.
-- Attribuer un nouveau rôle, sans remplacer les rôles existants.
begin;

insert into public.team_users (id, role)
values ('19272bdf-cb63-4453-92b3-234b326632be', 'jury');

commit;

select id, role
from public.team_users
where id in (
  '6c47adac-7fc9-41be-beaa-11b7717dbba6',
  '19272bdf-cb63-4453-92b3-234b326632be'
)
order by role;
