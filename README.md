# Le Four du Canal — aperçu privé

Aperçu visuel isolé du prototype local.
Date : 4 décembre 2026 à 15 h (Paris).
Lieu fictif : Atelier du Canal, 12 rue des Gourmands, 75010 Paris.

Le formulaire transmet prénom, nom et e-mail à la fonction serveur Supabase inscrire-participant. Elle vérifie les champs et enregistre une ligne dans participants ; une adresse normalisée est unique. Seul un retour réussi du serveur déclenche le message de confirmation. Les clés privilégiées restent dans Supabase. Aucun e-mail n’est envoyé, aucun classement ou accès équipe n’est exposé.

Projet Supabase : https://xeeixhbhfsdxrgeotlix.supabase.co. La fonction a été déployée par l’utilisateur depuis l’éditeur, vérification JWT désactivée pour l’inscription publique, validation et contrôle d’origine dans la fonction. Le Site reste privé. Les données sont de démonstration ; aucune ouverture publique n’est effectuée.

Vérifications de connexion exécutées : OPTIONS depuis l’origine du Site → 204 ; POST vide → 422. Aucun participant créé par ces vérifications. Les tests du formulaire utilisent un substitut de réponse réseau, et ne valent pas une inscription réelle dans Supabase. Prochaine recette : inscription fictive depuis le Site, contrôle de la ligne dans Table Editor puis essai doublon.

Le projet complet local avec rôles et classement reste dans /workspace/le-four-du-canal.

Publication statique via Sites ; accès propriétaire privé.

## Espace équipe

`/app/` propose la connexion e-mail/mot de passe Supabase et la consultation de la liste via `consulter-participants`. Le rôle est vérifié par la fonction serveur. La clé publiable est dans le client ; les clés privilégiées restent dans Supabase. Les mots de passe vont directement à Supabase Auth, jamais au serveur Sites ni dans les journaux du projet. Les jetons restent en mémoire de la page, sans localStorage/sessionStorage ; rechargement, fermeture, expiration ou déconnexion effacent la vue. Le contrôle d’accès privé Sites demeure en place, en plus des rôles métier Supabase.

À cette étape, seule la consultation est disponible : pas encore de changement de statut, saisie de notes, classement ni e-mails dans cette version hébergée. La fonction a répondu OPTIONS 204, GET anonyme 401 et GET jeton invalide 401 lors des vérifications réelles ; la connexion du compte organisateur et sa liste restent à confirmer par l’utilisateur.

Tests : `npm test` (5 scénarios de formulaire, 7 scénarios de connexion avec réseau substitué). Les tests sans navigateur ne constituent pas une recette visuelle.

## Séparation landing page / PWA — 14 novembre 2026

La landing page `/` présente le concours et recueille les inscriptions. Les liens de gestion y ont été retirés. L’application privée est accessible à `/app/` ; l’ancien `/equipe.html` redirige vers ce chemin. Le domaine est commun, les deux parcours ont des adresses distinctes. L’accès privé de démonstration Sites reste inchangé ; la page n’est donc pas encore ouverte au public réel.

La PWA possède manifeste, icônes et service worker limité à `/app/`. Le bouton d’installation apparaît uniquement si le navigateur expose l’invite correspondante ; sinon l’ajout à l’écran d’accueil dépend du menu du navigateur. Installation native et rendu mobile sont à tester par l’utilisateur.

Le cache contient uniquement la coquille statique de connexion. Les API, mots de passe, jetons et inscriptions ne sont jamais mis en cache par le service worker. Une connexion Internet est nécessaire pour se connecter et charger les données ; aucune saisie ou synchronisation de notes hors ligne n’est ajoutée. Les notes et le classement hébergés restent les prochaines étapes.

`npm test` : 16 scénarios (5 inscription, 7 connexion, 4 PWA).
