# Le Four du Canal — démonstration privée

## Parcours

- `/` : landing page du concours et inscription vers Supabase. Aucun lien de gestion sur cette page.
- `/app/` : PWA privée pour organisateur et jury ; l’ancien `/equipe.html` redirige vers celle-ci.
- Date de l’exercice : 4 décembre 2026, 15 h à Paris. Lieu fictif : Atelier du Canal, 12 rue des Gourmands, 75010 Paris.

Le Site est privé, accessible à sa propriétaire via ChatGPT. Le rôle métier Supabase est vérifié séparément côté serveur. La PWA peut être installée selon le navigateur ; installation sur Chrome ordinateur confirmée par l’utilisateur. Internet est nécessaire pour les données et les notes.

## État fonctionnel

Inscription, refus de doublon, lecture organisateur, lecture jury sans coordonnées et déconnexion ont été vérifiés par l’utilisateur. La notation est ajoutée : bouton Évaluer ou Modifier les notes réservé au jury, trois entiers de 0 à 10 (goût, texture, présentation FICTIFS), total sur 30. L’organisateur consulte les évaluations sans bouton d’écriture. Les notes sont relues depuis Supabase et préremplies lors d’une modification ; un échec de relecture est signalé. La première saisie réelle reste à confirmer par l’utilisateur.

Aucun e-mail envoyé ou programmé à cette étape. Classement et gestion des statuts dans la PWA restent à construire. Un seul compte jury et un jeu de notes par participation, conformément à l’hypothèse de prototype.

## Connexions

Projet : https://xeeixhbhfsdxrgeotlix.supabase.co. Fonctions Supabase : inscrire-participant, consulter-participants et noter-participant. Le code et les étapes SQL guidées se trouvent dans `/workspace/le-four-du-canal/supabase/`. Les fonctions protégées vérifient les jetons auprès de Supabase Auth et chargent les rôles en base. La notation appelle la RPC save_scores, réservée au serveur.

La clé publiable est destinée au navigateur. Les clés privilégiées restent dans Supabase. Mots de passe envoyés directement à Supabase Auth, jamais à Sites. Jetons uniquement en mémoire de la page, sans stockage persistant. Déconnexion, expiration, fermeture ou rechargement effacent l’accès local et les données de la vue.

## PWA et cache

Manifeste, icônes et service worker limités à l’application. Seule la coquille statique est mise en cache. API, jetons, mots de passe et inscriptions exclus du cache. Aucune saisie ni synchronisation de notes hors ligne. Le cache de coquille est versionné pour la mise à jour de notation.

## Vérifications

`npm test` : 22 tests réussis avec réponses réseau substituées (inscription, connexion, PWA et notation). Syntaxe JavaScript et ressources vérifiées. Ces tests ne valent pas une saisie réelle dans Supabase ni une recette visuelle. Contrôles réels anonymes : les fonctions de consultation et de notation renvoient 401 sans session.

Recette à faire : compte jury → Camille → 8/9/7 → message 24/30 → actualisation → mêmes notes → compte organisateur en lecture seule. Aucun mot de passe de compte utilisateur n’est fourni à l’agent.
