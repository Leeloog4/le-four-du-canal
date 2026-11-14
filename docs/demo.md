# Démonstration de la version en ligne — environ cinq minutes

## Avant de commencer

Ouvrir la [landing page](https://four-du-canal-exercice.leeloog4.chatgpt.site/) et la [PWA](https://four-du-canal-exercice.leeloog4.chatgpt.site/app/) dans le navigateur. Ces liens sont désormais publics ; seules les données de la PWA exigent un compte métier. Préparer les deux comptes Supabase organisateur/jury sans afficher leurs mots de passe. Le dépôt GitHub est privé lui aussi ; enregistrement ou démonstration depuis le compte propriétaire possibles sans modifier le partage.

Pour une inscription pendant la présentation, choisir à l’avance une adresse fictive .test jamais utilisée ; ne pas répéter Camille si elle existe déjà. L’envoi vers .test est simulé. Les comptes ne se créent pas depuis la PWA. Ne pas afficher les Secrets Supabase, Vault ou des jetons dans la vidéo.

## Parcours à présenter

| Durée | Manipulation | Explication courte |
| --- | --- | --- |
| 0:00–0:40 | Montrer la landing avec gâteau en fond, informations et formulaire ; réduire l’écran ou montrer le téléphone | « J’ai choisi le niveau 3. La page est séparée de WordPress ; un lien depuis le site existant est proposé. Date, lieu et barème sont des hypothèses d’exercice. » |
| 0:40–1:30 | Soumettre vide, puis inscrire un nouveau nom fictif avec une adresse .test unique ; soumettre à nouveau la même adresse | « Le formulaire valide les champs. L’inscription est enregistrée dans Supabase ; le doublon est refusé. Pour cette adresse réservée, aucun e-mail réel n’est envoyé. » |
| 1:30–2:15 | PWA : se connecter organisateur, retrouver ce participant, ouvrir E-mails et ses détails | « L’organisateur consulte les coordonnées, les statuts et l’historique. Chaque message indique le destinataire, le contenu, l’échéance et son état. Accepté par Brevo ne veut pas dire livré. » |
| 2:15–3:15 | Se déconnecter, se connecter jury ; montrer les actifs sans adresses ; noter ce nouveau participant 8/9/7 puis ouvrir Classement | « Seul le jury saisit les trois critères fictifs, sur 10 chacun. Total 24/30. Les ex æquo gardent le même rang. Sur téléphone, les actions sont visibles dans des cartes. » |
| 3:15–3:55 | Revenir organisateur, retirer le participant créé pour la démo ; montrer les notes conservées et l’exclusion du classement | « L’organisateur peut retirer et réactiver. Le jury ne reçoit plus les participants retirés après actualisation. Un retrait annule les messages encore en attente. » |
| 3:55–4:35 | Historique : ouvrir le rappel de Test Cron Fictif déjà traité | « Cron appelle une fonction serveur chaque minute, sans Make. Ce rappel de recette est simulé, traité une fois : attempts=1, sans identifiant Brevo. La confirmation réelle a été reçue séparément sur une adresse contrôlée. » |
| 4:35–5:00 | Montrer README et les résultats de recette | « 139 tests automatisés passent. L’inscription, les rôles, les notes et plusieurs parcours mobiles ont été vérifiés avec l’utilisateur. Le rappel réel prévu le 3 décembre n’a pas encore été reçu ; WordPress n’a pas été modifié. » |

La démonstration proposée n’a pas encore été enregistrée. Répéter les transitions entre comptes avant de filmer. Les données réellement présentes priment sur les exemples du guide ; ne pas annoncer un résultat absent de l’écran.

## Montrer les deux e-mails sans allonger la présentation

Dans l’onglet E-mails organisateur, ouvrir successivement Voir le message pour une confirmation et un rappel, puis montrer objet, contenu, destinataire et échéance. Dire : « La confirmation se déclenche après enregistrement ; le rappel à J−1, via Cron. La confirmation réelle a été reçue sur une adresse contrôlée. Ce rappel affiché est simulé et a été traité une fois. » Ne pas déclencher de nouvel envoi pour montrer les contenus. La [fiche de remise](remise.md) contient les textes complets, l’articulation WordPress et les limites de sécurité.

## Points à expliquer si on vous interroge

- Concours fictif : 4 décembre 2026 à 15 h Paris ; rappel J−1 le 3 décembre à 15 h Paris.
- Goût, texture, présentation : trois entiers de 0 à 10, somme sur 30. Rangs de compétition 1/1/3 ; un compte jury, un jeu de notes par participant.
- Session : actualisation sans nouvelle saisie dans le même onglet, une heure maximum depuis la connexion initiale, droits revérifiés par le serveur. Déconnexion explicite sur appareil partagé.
- Prototype connecté : Internet requis, aucune saisie de notes hors ligne. PWA installée sur Chrome ordinateur ; installation mobile non validée séparément.
- Les adresses .test restent simulées. L’essai manuel indépendant « Envoyer l’e-mail de test » envoie un vrai message à l’adresse configurée et ne fait pas partie de email_jobs ; inutile de l’actionner pendant cette démo.
- Aucun besoin d’avancer les rappels existants ou de recréer Test Cron Fictif pour la présentation. Les scripts 11/12 gardent la trace de la recette déjà effectuée.

## Derniers contrôles avant remise

Vérifier le rendu final du fond gâteau sur ordinateur et téléphone. Déconnexion → actualisation sans restauration de session est confirmée par l’utilisateur. La conservation de connexion à l’actualisation est signalée comme validée par l’utilisateur ; son expiration et la suppression du stockage sont couvertes par les tests substitués. Si nécessaire, montrer le projet par enregistrement tant que les accès de l’évaluateur ne sont pas organisés. Ne jamais transmettre le mot de passe propriétaire pour ouvrir la démonstration.

Le [prototype local autonome](../prototype-local/README.md) reste une archive distincte : il se lance avec Node 24, SQLite et e-mails simulés, et ne reproduit pas toute l’interface publiée.
