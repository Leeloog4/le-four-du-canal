# État de déploiement — 14 novembre 2026

Ce fichier distingue les sources versionnées des fonctions réellement activées.

| Composant | État constaté |
| --- | --- |
| Landing page | https://four-du-canal-exercice.leeloog4.chatgpt.site/ — démonstration propriétaire privée ; affichage mobile lisible, sans débordement, formulaire visible selon la recette utilisateur |
| Application PWA | Même domaine, chemin /app/ ; installation Chrome ordinateur confirmée par l’utilisateur |
| Dernier commit source Sites publié | 5c0085b113e483a4292f10b0b5abd19db7eb0358 |
| Supabase | https://xeeixhbhfsdxrgeotlix.supabase.co |
| consulter-participants | Version avec lecture des notes déployée manuellement ; lecture réelle confirmée |
| noter-participant | Déployée ; saisie 8/9/7, modification et relecture confirmées |
| changer-statut-participant | Déployée ; retrait/réactivation et conservation des notes confirmés |
| envoyer-email-test | Déployée ; réception réelle du message de test confirmée par l’utilisateur |
| inscrire-participant | Version avec transaction inscription + deux tâches déployée manuellement ; inscription et réception de confirmation validées par l’utilisateur |
| SQL guidé | Étapes exécutées par l’utilisateur dans la conversation ; contrôle direct du schéma non disponible pour l’agent |
| Confirmation automatique | Activée ; réception confirmée par l’utilisateur pour une nouvelle inscription avec adresse contrôlée |
| Rappel automatique | SQL 09/10, fonction, secrets et Cron configurés selon l’utilisateur ; appels 200 et refus sans secret confirmés. REMINDERS_ENABLED=true enregistré selon l’utilisateur. Recette SQL 11/12 : capture du rappel fictif simulated, attempts=1, processed_at renseigné et message_id NULL. Traitement dû simulé vérifié ; seconde lecture attempts=1 confirmée par l’utilisateur, retrait du participant fictif signalé ; aucune livraison réelle de rappel revendiquée |
| GitHub | Dépôt privé https://github.com/Leeloog4/le-four-du-canal créé par l’utilisateur, branche main ; source consolidée avec historique conservé |

Les inscriptions et notes de démonstration ne sont pas exportées de Supabase. Aucun secret Brevo ou Supabase privilégié n’est stocké dans ce dépôt. La clé publiable Supabase est publique par conception et ne confère pas un rôle organisateur.

Ne pas appliquer `supabase/migrations/001_initial.sql` au projet existant : il recréerait des tables déjà présentes. Les scripts `supabase/guided/` gardent la trace des étapes successives ; ne pas les relancer en bloc sans vérifier l’état réel. Les fichiers SQL déjà appliqués sont conservés sans réécriture.

## Historique organisateur — nouvelle version préparée

- consulter-emails : déploiement manuel signalé par l’utilisateur après les consignes ; lecture de l’historique et des détails organisateur confirmée. Vérifie Supabase Auth et rôle organizer dans son code. Aucun nouveau script SQL nécessaire.
- PWA : onglet E-mails étendu à l’historique des inscriptions avec lecture seule et détails. Publication réussie, déploiement appgdep_6af8831e645081919b125457d59a05a9 ; fonction installée selon l’utilisateur ; statuts et détails organisateur confirmés par sa recette.
- Suite locale : 126 tests réussis ; recette navigateur organisateur confirmée par l’utilisateur ; absence d’onglet E-mails et d’adresses des inscrits côté jury confirmée par la recette utilisateur.

Adaptation mobile PWA publiée : cartes sous 760 px, actions visibles en pleine largeur ; déploiement appgdep_6af8872877a48191a127f6afe72889bd succeeded. Recette téléphone après correction encore à confirmer.

Filtre jury actifs : nouvelle version de consulter-participants préparée avec filtre serveur, à remplacer manuellement dans Supabase. Frontend prêt à masquer les retirés et à recalculer le compteur ; ne pas confondre publication PWA et déploiement de cette fonction.
