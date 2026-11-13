# Le Four du Canal — démonstration privée

## Parcours

- `/` : landing page du concours et inscription vers Supabase. Aucun lien de gestion sur cette page.
- `/app/` : PWA privée pour organisateur et jury ; l’ancien `/equipe.html` redirige vers celle-ci.
- Date de l’exercice : 4 décembre 2026, 15 h à Paris. Lieu fictif : Atelier du Canal, 12 rue des Gourmands, 75010 Paris.

Le Site est privé, accessible à sa propriétaire via ChatGPT. Le rôle métier Supabase est vérifié séparément côté serveur. La PWA peut être installée selon le navigateur ; installation sur Chrome ordinateur confirmée par l’utilisateur. Internet est nécessaire pour les données et les notes.

## État fonctionnel

Inscription, refus de doublon, lecture organisateur, lecture jury sans coordonnées et déconnexion ont été vérifiés par l’utilisateur. La notation est ajoutée : bouton Évaluer ou Modifier les notes réservé au jury, trois entiers de 0 à 10 (goût, texture, présentation FICTIFS), total sur 30. L’organisateur consulte les évaluations sans bouton d’écriture. Les notes sont relues depuis Supabase et préremplies lors d’une modification ; un échec de relecture est signalé. La saisie réelle 8/9/7 pour Camille, le total 24/30, la relecture après actualisation et le préremplissage ont été confirmés par l’utilisateur. La consultation des notes par l’organisateur sans bouton de modification est également confirmée.

Aucun e-mail envoyé ou programmé à cette étape. Le classement interne est disponible dans une vue dédiée aux deux rôles. L’organisateur peut retirer et réactiver une participation, avec confirmation, sans supprimer ses notes ou son inscription. Un seul compte jury et un jeu de notes par participation, conformément à l’hypothèse de prototype.

## Connexions

Projet : https://xeeixhbhfsdxrgeotlix.supabase.co. Fonctions Supabase : inscrire-participant, consulter-participants et noter-participant. Le code et les étapes SQL guidées se trouvent dans `/workspace/le-four-du-canal/supabase/`. Les fonctions protégées vérifient les jetons auprès de Supabase Auth et chargent les rôles en base. La notation appelle la RPC save_scores, réservée au serveur.

La clé publiable est destinée au navigateur. Les clés privilégiées restent dans Supabase. Mots de passe envoyés directement à Supabase Auth, jamais à Sites. Jetons uniquement en mémoire de la page, sans stockage persistant. Déconnexion, expiration, fermeture ou rechargement effacent l’accès local et les données de la vue.

## PWA et cache

Manifeste, icônes et service worker limités à l’application. Seule la coquille statique est mise en cache. API, jetons, mots de passe et inscriptions exclus du cache. Aucune saisie ni synchronisation de notes hors ligne. Le cache de coquille est versionné pour la mise à jour de notation.

## Vérifications

`npm test` : 32 tests réussis avec réponses réseau substituées (inscription, connexion, PWA et notation). Syntaxe JavaScript et ressources vérifiées. Ces tests ne valent pas une saisie réelle dans Supabase ni une recette visuelle. Contrôles réels anonymes : les fonctions de consultation et de notation renvoient 401 sans session.

Recette à faire : compte jury → Camille → 8/9/7 → message 24/30 → actualisation → mêmes notes → compte organisateur en lecture seule. Aucun mot de passe de compte utilisateur n’est fourni à l’agent.

## Classement interne

Vue Classement dans `/app/`, réservée aux comptes équipe. Calcul à partir des données authentifiées renvoyées par consulter-participants : participations actives avec trois notes complètes, somme sur 30, ordre décroissant, rangs de compétition 1/1/3 en cas d’égalité. Aucun départage ajouté. Zéro est une note valide ; absence de notes ou participation retirée excluent du classement. Aucun e-mail de participant dans cette vue. Les données de classement sont effacées à la déconnexion et ne sont pas mises en cache par le service worker.

Le classement se recalcule après relecture des inscriptions/notes et après une notation. Aucun changement supplémentaire de fonction Supabase requis pour cette étape ; la fonction actuelle fournit déjà les notes. Le rendu et les scores affichés restent à confirmer par l’utilisateur dans sa PWA.

## Gestion des participations

Boutons Retirer et Réactiver réservés à l’organisateur, via changer-statut-participant et la RPC set_participant_status. Le rôle est revérifié côté serveur. Confirmation avant l’action ; affichage actualisé après relecture du statut depuis la base. Un retrait conserve les notes, exclut du classement et empêche la notation ; la réactivation restaure l’éligibilité au classement avec les notes conservées. Le jury n’a aucun bouton de modification du statut.

Aucune suppression et aucun e-mail à cette étape. L’annulation des futurs messages en attente sera ajoutée lors de la création de l’outbox. Contrôles réels de la fonction : OPTIONS 204, appel sans session ou avec jeton invalide 401. Aucun statut de participant réel modifié par l’agent ; retrait/réactivation à vérifier par l’utilisateur. Six scénarios de tests frontend ajoutés : cycle retrait/réactivation et notes, annulation, séparation des rôles, erreur réseau, relecture incohérente, double clic/déconnexion.
