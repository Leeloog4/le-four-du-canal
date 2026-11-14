# Règles du projet

Lire docs/cadrage.md, docs/decisions.md et docs/recette.md avant de modifier.
Sources originales : docs/sources/, les conserver sans réécriture.
Pas de Make. Appels Brevo uniquement côté serveur. Ne jamais publier de secret.
Inscription publique ; données des inscrits, notes et classement internes.
Organisateur : lecture et changement de statut ; jury : saisie des notes, sans e-mails des participants.
Trois critères FICTIFS sur 10, somme sur 30 ; les égalités restent ex æquo.
Ne pas inventer date, adresse, prix, capacités ou réponses du client.
Tout e-mail non réellement accepté par Brevo doit rester identifié comme simulé, en attente ou en erreur.
« Accepté par Brevo » ne signifie pas « livré ». Aucun envoi externe dans les tests.
Maintenir la traçabilité et les preuves dans docs/recette.md ; distinguer vérifié localement et à vérifier en hébergement.
Tests : npm test. Vérification syntaxique : npm run check. Node >=24.

## Dépôt consolidé

- dist/ : site et PWA publiés via Sites.
- supabase/ : fonctions et scripts SQL, avec état de déploiement dans DEPLOYMENT.md.
- tests/ : tests frontend et fonctions serveur avec réseau substitué ; aucun e-mail réel dans les tests.
- prototype-local/ : archive Node/SQLite initiale, distincte de l’application hébergée.
- Ne pas appliquer migrations/001_initial.sql au projet Supabase existant ; les étapes guided/ ont été utilisées progressivement.
- inscrire-participant : version avec confirmation déployée manuellement et recette utilisateur validée. Le traitement des rappels et Cron sont configurés et activés selon l’utilisateur ; recette du rappel fictif dû encore à vérifier. Ne pas confondre appels HTTP réussis et traitement métier validé.
- GitHub doit rester privé ; ne publier aucun secret, jeton de session, fichier .env ou base de données.
- Source de travail principale : ce dépôt consolidé, GitHub origin https://github.com/Leeloog4/le-four-du-canal.git, branche main.
- Ne plus modifier les anciennes copies /workspace/le-four-du-canal et /workspace/sites/four-du-canal-demo comme des sources parallèles. Pousser les changements complets sur origin ; avant une publication Sites, pousser le même commit sur sites et utiliser ce même checkout pour l’archive.
