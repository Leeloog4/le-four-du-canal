# État de déploiement — 14 novembre 2026

Ce fichier distingue les sources versionnées des fonctions réellement activées.

| Composant | État constaté |
| --- | --- |
| Landing page | https://four-du-canal-exercice.leeloog4.chatgpt.site/ — démonstration propriétaire privée |
| Application PWA | Même domaine, chemin /app/ ; installation Chrome ordinateur confirmée par l’utilisateur |
| Dernier commit source Sites publié | ee5af4209c40ab51069f0d9606812c9a67b31371 |
| Supabase | https://xeeixhbhfsdxrgeotlix.supabase.co |
| consulter-participants | Version avec lecture des notes déployée manuellement ; lecture réelle confirmée |
| noter-participant | Déployée ; saisie 8/9/7, modification et relecture confirmées |
| changer-statut-participant | Déployée ; retrait/réactivation et conservation des notes confirmés |
| envoyer-email-test | Déployée ; réception réelle du message de test confirmée par l’utilisateur |
| inscrire-participant | Version avec transaction inscription + deux tâches déployée manuellement ; inscription et réception de confirmation validées par l’utilisateur |
| SQL guidé | Étapes exécutées par l’utilisateur dans la conversation ; contrôle direct du schéma non disponible pour l’agent |
| Confirmation automatique | Activée ; réception confirmée par l’utilisateur pour une nouvelle inscription avec adresse contrôlée |
| Rappel automatique | SQL 09/10, fonction, secrets et Cron configurés selon l’utilisateur ; appels 200 et refus sans secret confirmés. REMINDERS_ENABLED=true enregistré selon l’utilisateur. Recette SQL 11/12 : capture du rappel fictif simulated, attempts=1, processed_at renseigné et message_id NULL. Traitement dû simulé vérifié ; absence de retraitement à vérifier ; aucune livraison réelle de rappel revendiquée |
| GitHub | Dépôt privé https://github.com/Leeloog4/le-four-du-canal créé par l’utilisateur, branche main ; source consolidée avec historique conservé |

Les inscriptions et notes de démonstration ne sont pas exportées de Supabase. Aucun secret Brevo ou Supabase privilégié n’est stocké dans ce dépôt. La clé publiable Supabase est publique par conception et ne confère pas un rôle organisateur.

Ne pas appliquer `supabase/migrations/001_initial.sql` au projet existant : il recréerait des tables déjà présentes. Les scripts `supabase/guided/` gardent la trace des étapes successives ; ne pas les relancer en bloc sans vérifier l’état réel. Les fichiers SQL déjà appliqués sont conservés sans réécriture.
