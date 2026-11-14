# Le Four du Canal

Exercice de **niveau 3** : landing d’inscription, application privée en PWA et e-mails. Stack : Sites, Supabase (base, Auth, fonctions et Cron), Brevo côté serveur. **Aucun Make.**

## Ouvrir la version en ligne

- [Landing page](https://four-du-canal-exercice.leeloog4.chatgpt.site/)
- [Application PWA](https://four-du-canal-exercice.leeloog4.chatgpt.site/app/)

Liens publics : aucune connexion ChatGPT nécessaire. La PWA affiche son formulaire de connexion ; un compte Supabase organisateur ou jury est requis pour les données internes. Aucun mot de passe n’est dans ce dépôt. Prévoir une vidéo ou une présentation du parcours authentifié pour l’évaluateur.

## Ce qui fonctionne et a été vérifié

Inscription persistée, validation des champs et doublons, connexion par rôle, notes et relecture, classement et ex æquo, retrait/réactivation conservant les notes. Jury : actifs uniquement, sans adresses ; organisateur : actifs/retirés et historique e-mail, notes en lecture seule. Parcours et notation mobile vérifiés avec l’utilisateur.

Confirmation reçue sur une adresse contrôlée. Rappel planifié par Cron : traitement fictif dû vérifié en simulation, une seule tentative ; **aucune livraison réelle de rappel revendiquée**. Les statuts réels/simulés et contenus sont consultables dans l’historique organisateur.

Hypothèses d’exercice : concours le **4 décembre 2026 à 15 h Paris**, lieu fictif Atelier du Canal, 12 rue des Gourmands, 75010 Paris. Trois critères **FICTIFS** goût/texture/présentation, entiers 0–10, somme sur 30 ; classement interne des actifs évalués, rangs 1/1/3. Aucune réponse client supplémentaire obtenue.

Session conservée après actualisation dans l’onglet, une heure maximum ; déconnexion puis actualisation vérifiées. Jeton temporaire et échéance dans sessionStorage, pas de mot de passe ou données métier ; droits vérifiés serveur. Internet requis, cache PWA limité à la coquille statique. Voir les [limites de sécurité](docs/remise.md).

## Lancer un parcours local autonome

Node.js **24 ou plus**, aucune dépendance npm à installer. Depuis le dépôt cloné ou téléchargé :

```sh
cd prototype-local
cp .env.example .env
npm run setup-demo
npm start
```

Ouvrir http://localhost:3000. setup-demo affiche les comptes et mots de passe de démonstration ; e-mails simulés, SQLite local. Il s’agit du **prototype initial archivé**, distinct du design et du déploiement actif. Voir [son guide](prototype-local/README.md).

La version hébergée active utilise dist/ et les fonctions Supabase ; servir dist sur localhost ne suffit pas à reproduire son backend, qui autorise l’origine hébergée configurée. État des déploiements dans [DEPLOYMENT.md](DEPLOYMENT.md). Ne pas relancer le schéma initial ou les scripts guidés en bloc sur la base existante.

## Vérifications

Depuis la racine avec Node 24 :

```sh
npm run check
npm test
```

Dernier résultat : **139 tests réussis**, syntaxe vérifiée. Réseau substitué, aucun e-mail réel dans les tests. Prototype archivé : npm run test:local (20 tests réussis lors de la consolidation).

| Recette manuelle | Résultat |
| --- | --- |
| Inscription et erreurs | Inscription enregistrée, champs vides bloqués, doublon refusé, confirmation reçue ; observations utilisateur |
| Rôles et notes | Jury sans adresses ni retirés ; notes 8/9/7 → 24/30, relecture et ex æquo ; retrait/réactivation validés |
| Rappel fictif dû | Capture simulated, attempts=1, message_id NULL ; seconde lecture toujours à 1, aucune livraison réelle revendiquée |

## Documents de remise

- [Fiche de remise](docs/remise.md) : WordPress, accès/sécurité, contenu/déclencheur/destinataire/statut des e-mails et checklist.
- [Note de cadrage Notion](https://app.notion.com/p/417ec4a3bfbd81d7b738c6cf9f62c85f) et [copie actualisée](docs/note-cadrage-actualisee.md).
- [Décisions](docs/decisions.md), [architecture actuelle](docs/architecture-hebergee.md), [cahier de recette](docs/recette.md).
- [Démonstration de cinq minutes](docs/demo.md) : scénario préparé ; direct ou enregistrement encore à réaliser.

WordPress n’a pas été modifié : un bouton/lien depuis son site vers la landing est proposé. Rendu du dernier fond gâteau à confirmer sur téléphone/ordinateur. Le rappel simulé satisfait la démonstration de cette partie du brief ; réception réelle à l’échéance non vérifiée.

Code public [Leeloog4/le-four-du-canal](https://github.com/Leeloog4/le-four-du-canal), branche main. Sources : dist/ (frontend), supabase/ (fonctions/SQL), tests/, docs/ ; prototype-local/ est une archive. origin est GitHub, sites le dépôt de publication : conserver le même état source pour publier. [Règles de versionnement](docs/versionnement.md). Secrets privés, .env, bases et exports exclus ; clé Supabase publiable seulement côté navigateur.
