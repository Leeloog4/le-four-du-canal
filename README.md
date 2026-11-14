# Le Four du Canal

Projet d’exercice : concours amateur de pâtisserie, landing page d’inscription et application privée en PWA.

## Démonstration

- Site : https://four-du-canal-exercice.leeloog4.chatgpt.site/
- PWA : https://four-du-canal-exercice.leeloog4.chatgpt.site/app/

La démonstration Sites reste privée. Les rôles organisateur/jury sont vérifiés séparément dans Supabase. L’installation sur Chrome ordinateur a été confirmée par l’utilisateur.

Date fictive retenue : **4 décembre 2026 à 15 h, Europe/Paris**. Lieu fictif : Atelier du Canal, 12 rue des Gourmands, 75010 Paris. Les trois critères goût/texture/présentation sur 10 constituent un barème de démonstration, pas un règlement client réel.

## Guide de présentation

Parcours commenté d’environ cinq minutes : [docs/demo.md](docs/demo.md). Architecture active : [docs/architecture-hebergee.md](docs/architecture-hebergee.md). Besoin et hypothèses : [docs/cadrage.md](docs/cadrage.md) ; choix successifs : [docs/decisions.md](docs/decisions.md).

## Organisation du dépôt

| Chemin | Contenu |
| --- | --- |
| `dist/` | Landing page et PWA, sans compilation |
| `supabase/functions/` | Fonctions serveur ; lire l’état de déploiement avant toute publication |
| `supabase/guided/` | Étapes SQL exécutées progressivement avec l’utilisateur |
| `supabase/migrations/` | Schéma initial de référence, à ne pas relancer sur la base existante |
| `tests/` | Tests du site, de la PWA et des fonctions avec réponses réseau substituées |
| `docs/` | Cadrage, décisions, sources, architecture et recette |
| `prototype-local/` | Archive du premier prototype Node/SQLite, distinct de l’application hébergée |
| `.openai/hosting.json` | Identité du Site existant ; ne pas créer un autre Site pour ce projet |

## Fonctionnement vérifié par l’utilisateur

Inscription dans Supabase, refus des doublons, accès organisateur, accès jury sans coordonnées, saisie/modification des notes et relecture après actualisation, classement interne, égalités conservées, retrait et réactivation avec conservation des notes. Un message de test Brevo a été reçu après un clic explicite de l’organisateur.

Le classement utilise la somme sur 30 des trois notes complètes, pour les participations actives, par ordre décroissant. Les ex æquo restent ex æquo avec les rangs 1/1/3. L’organisateur gère les statuts et consulte les notes ; seul le jury écrit les notes.

Le service worker ne conserve que les ressources statiques de connexion. Inscriptions, notes, mots de passe, jetons et API ne sont pas mis en cache. Internet est nécessaire pour charger et modifier les données.

## État actuel et limites

La confirmation automatique a été reçue après une inscription contrôlée. Supabase Cron et le traitement des rappels sont configurés : une tâche fictive due a été traitée en simulation sans répétition ; aucune livraison réelle de rappel n’est revendiquée. L’historique des confirmations/rappels est réservé à l’organisateur. Les retirés restent chez l’organisateur et sont masqués pour le jury.

La PWA affiche des cartes sur téléphone. Nouvelle version : connexion conservée après actualisation dans le même onglet, sous échéance absolue d’une heure maximum. Seuls le jeton d’accès temporaire et l’échéance sont dans sessionStorage ; aucun mot de passe, refresh token ou donnée métier. Déconnexion et expiration suppriment ce stockage. Les droits sont revérifiés côté serveur avant affichage. Le service worker ne met jamais ces informations en cache.

La landing utilise un visuel de gâteau avec projections de farine en fond pleine largeur de l’accueil, généré pour l’exercice et servi en WebP responsive. Conservation de connexion après actualisation signalée comme validée par l’utilisateur. Derniers contrôles à faire : déconnexion puis actualisation et rendu final du fond gâteau. Lire [DEPLOYMENT.md](DEPLOYMENT.md) et [docs/recette.md](docs/recette.md) pour les preuves et limites ; intégration WordPress réelle et livraison réelle du rappel restent non vérifiées.

## Lancer et vérifier le projet

La version active se consulte aux deux URL ci-dessus dans le compte propriétaire. Se connecter ensuite avec un compte Supabase organisateur ou jury fourni séparément ; aucun compte ni mot de passe n’est inclus dans le dépôt. Une copie servie sur localhost ne remplace pas ce déploiement : les fonctions Supabase autorisent l’origine hébergée configurée.

Pour un parcours local autonome **distinct de la version publiée**, Node 24 suffit, sans service externe :

```sh
cd prototype-local
cp .env.example .env
npm run setup-demo
npm start
```

Ouvrir http://localhost:3000 ; setup-demo affiche les deux comptes de démonstration. E-mails simulés, SQLite local. Conserver .env hors Git. Voir [le guide du prototype](prototype-local/README.md).

## Tests

Prérequis : **Node.js 24 ou plus récent**. Aucune installation de dépendances nécessaire.

```sh
npm run check
npm test
```

Les tests remplacent les appels réseau et n’envoient aucun message réel. Pour vérifier aussi le prototype local archivé :

```sh
npm run test:local
```

Vérification du 14 novembre 2026 : syntaxe réussie, **139 tests du dépôt actif réussis** ; les **20 tests du prototype local** avaient réussi lors de la consolidation. Un contrôle ciblé des fichiers n’a repéré aucune clé secrète reconnaissable ni base locale incluse. Les tests ne remplacent pas les recettes manuelles des intégrations et des e-mails.

## Trois vérifications à présenter

| Scénario | Résultat constaté |
| --- | --- |
| Inscription puis doublon | Inscription enregistrée, confirmation reçue sur une adresse contrôlée, deuxième soumission refusée ; recette utilisateur |
| Jury et organisateur | Notes et classement vérifiés ; jury sans adresses ni retirés, organisateur avec retirés et réactivation ; recette utilisateur |
| Rappel dû de démonstration | Capture SQL : simulated, attempts=1, message_id NULL ; seconde lecture toujours à 1. Traitement simulé vérifié, aucune livraison réelle de rappel revendiquée |

Preuves et limites détaillées dans [docs/recette.md](docs/recette.md). Les tests et cette préparation ne constituent pas un enregistrement de démonstration déjà réalisé.

## Déploiement et secrets

Le site et la PWA utilisent Sites ; les fonctions et la base utilisent Supabase ; les e-mails utilisent Brevo côté serveur. Aucun Make.

Les fonctions sont déployées manuellement dans Supabase. Les secrets Supabase privilégiés et Brevo restent dans les Secrets du fournisseur, jamais dans ce dépôt ni dans le navigateur. La clé publiable Supabase présente dans le client est publique par conception et ne donne aucun rôle organisateur.

Ne pas appliquer le schéma initial ni les scripts guidés en bloc sur la base existante. Vérifier les étapes déjà exécutées, conserver leur historique et ajouter de nouvelles étapes pour les évolutions.

## Versionnement

L’historique Git du site/PWA est conservé dans le dépôt privé [Leeloog4/le-four-du-canal](https://github.com/Leeloog4/le-four-du-canal). La branche principale est `main`. Le remote `origin` correspond à GitHub ; `sites` correspond au dépôt utilisé pour publier la démonstration. Les prochaines modifications doivent partir de ce dépôt consolidé, puis être poussées vers GitHub ; une publication Sites demande aussi la synchronisation du même état source vers le remote Sites. Ne jamais ajouter de fichier `.env`, clé secrète, base locale ou export de données utilisateur.
