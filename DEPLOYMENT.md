# État de déploiement — 14 novembre 2026

Ce fichier distingue les sources versionnées des fonctions réellement activées.

| Composant | État constaté |
| --- | --- |
| Landing page | https://four-du-canal-exercice.leeloog4.chatgpt.site/ — démonstration propriétaire privée ; affichage mobile lisible, sans débordement, formulaire visible selon la recette utilisateur |
| Application PWA | Même domaine, chemin /app/ ; installation Chrome ordinateur confirmée par l’utilisateur |
| Dernier commit source Sites publié | 7208473a2b82d9022aff33ca2e6450312712cabc |
| Supabase | https://xeeixhbhfsdxrgeotlix.supabase.co |
| consulter-participants | Déployée manuellement avec notes et filtre jury actifs ; recette utilisateur confirmée |
| consulter-emails | Déployée manuellement ; historique et détails organisateur confirmés, accès jury exclu |
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

Filtre frontend jury publié, déploiement appgdep_6af887fe72e88191acd29cdde603d1bb succeeded. Mise à jour serveur consulter-participants encore en attente de déploiement manuel utilisateur.

Filtre serveur jury : déploiement manuel de consulter-participants signalé comme effectué par l’utilisateur ; disparition de Test Cron Fictif après actualisation jury confirmée. Les mentions de mise à jour en attente ci-dessus sont historiques.

Recette des retirés clôturée : disparition côté jury et maintien côté organisateur avec statut Retiré et bouton Réactiver confirmés par l’utilisateur.

Lisibilité mobile publiée : textes et saisie agrandis, déploiement appgdep_6af88a5bcb188191a67f2648de5a4948 succeeded. Appréciation visuelle sur téléphone encore à confirmer. Aucun changement Supabase requis.

Session et gâteau publiés : déploiement appgdep_6af88c38f1548191bc48cba7196bcd03 succeeded. Jeton temporaire conservé dans sessionStorage de l’onglet pendant une heure maximum depuis la connexion initiale, contrôle serveur à chaque restauration ; aucun nouveau réglage Supabase. Nouveau visuel WebP responsive. Tests 139 réussis ; recette navigateur utilisateur actualisation/déconnexion et rendu visuel encore à confirmer.

Gâteau en fond pleine largeur de l’accueil publié : appgdep_6af88d3255208191937961bb445b2995 succeeded. Texte superposé, sources paysage/portrait selon écran ; rendu utilisateur encore à confirmer.

Documentation de remise actualisée : README, docs/demo.md (parcours cinq minutes), docs/architecture-hebergee.md, matrice du cadrage et recette. Actualisation sans reconnexion signalée comme validée par l’utilisateur ; déconnexion suivie d’actualisation et rendu final du fond gâteau restent à confirmer. Aucune modification applicative ou de partage pour cette mise à jour documentaire.
