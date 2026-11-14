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
| inscrire-participant | La version déployée enregistre les inscriptions sans confirmation automatique. Le fichier de ce dépôt contient la NOUVELLE version préparée, à déployer manuellement après les règles SQL e-mail |
| SQL guidé | Étapes exécutées par l’utilisateur dans la conversation ; contrôle direct du schéma non disponible pour l’agent |
| Confirmation automatique | Préparée dans les sources, non activée dans Supabase à ce stade |
| Rappel automatique | Non activé ; planificateur et traitement encore à construire/configurer |
| GitHub | Connexion Leeloog4 confirmée ; création privée refusée par les permissions de l’intégration. Dépôt local prêt, dépôt distant à créer manuellement, aucun push GitHub effectué |

Les inscriptions et notes de démonstration ne sont pas exportées de Supabase. Aucun secret Brevo ou Supabase privilégié n’est stocké dans ce dépôt. La clé publiable Supabase est publique par conception et ne confère pas un rôle organisateur.

Ne pas appliquer `supabase/migrations/001_initial.sql` au projet existant : il recréerait des tables déjà présentes. Les scripts `supabase/guided/` gardent la trace des étapes successives ; ne pas les relancer en bloc sans vérifier l’état réel. Les fichiers SQL déjà appliqués sont conservés sans réécriture.
