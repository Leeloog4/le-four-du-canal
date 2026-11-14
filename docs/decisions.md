# Décisions et contradictions

| ID | Constat | Décision de prototype et conséquence |
| --- | --- | --- |
| D01 | La conversation résumée parlait d’un classement organisateur ; la note actuelle accorde L à organisateur et jury | Suivre la matrice actuelle, classement pour les deux rôles internes. Aucun accès anonyme |
| D02 | Ancienne architecture : organisateur autorisé à noter ; note : organisateur L, jury C/M | Le jury seul écrit les notes ; vérification serveur, bouton absent pour l’organisateur |
| D03 | « Seuls les comptes authentifiés accèdent à l’application » était ambigu | Page/formulaire publics, données/notes/classement privés |
| D04 | Aucun arbitrage réel client fourni | Les hypothèses acceptées pour l’exercice deviennent des règles de prototype explicites, jamais des faits client |
| D05 | Supabase/Vercel/GitHub proposés, pas de comptes techniques fournis | Serveur Node 24 sans dépendance et SQLite persistant pour exécution locale. Adaptateur Supabase, migration RLS et entrée Vercel préparés. Aucun dépôt distant ni déploiement effectué |
| D06 | La procédure Sites consultée dépend de scripts absents de cet environnement | Conserver la réalisation locale et la cible Vercel/Supabase déjà proposée ; pas de faux lien de déploiement |
| D07 | L’ancien plan programme chaque rappel directement chez Brevo | File d’attente métier en base + appel Brevo à l’échéance, pour ne pas dépendre d’un horizon de programmation fournisseur. Aucun Make. Déclencheur local 30 s, Vercel cron 1 min sous réserve du forfait |
| D08 | Inscription après J−1 | Confirmation normale, rappel marqué non prévu ; aucun message daté dans le passé |
| D09 | Échec e-mail après inscription | L’inscription reste acquise. État visible à l’organisateur. Un résultat réseau incertain ne déclenche pas de renvoi automatique |
| D10 | Barème non fourni | Goût/texture/présentation FICTIFS, entiers 0–10, somme. Évaluation complète obligatoire ; non-évalués exclus du classement |
| D11 | Nombre réel de jurés inconnu | Un compte jury et un jeu de notes par participant ; aucun calcul multi-jurés inventé |
| D12 | Doublons non définis | E-mail trim/minuscules unique ; refus HTTP 409 et message clair. Hypothèse à confirmer avant usage réel |
| D13 | Gestion des participants peu détaillée | Statuts inscrit/retiré ; retrait exclut classement et annule seulement les e-mails en attente. Pas de suppression, pas de nouvelle programmation lors d’une réactivation |
| D14 | Un ancien statut « envoyé » pourrait confondre demande et livraison | Utiliser « accepté par Brevo » seulement avec messageId. La livraison réelle n’est pas suivie par webhook dans cette V1 |
| D15 | « Dans trois semaines » sans date absolue | Date de démo fixe et explicitement fictive, configurable. Aucun contenu client inventé |

Ces décisions sont autorisées pour le prototype par la demande d’avancer avec des hypothèses cohérentes. Les divergences sont visibles et réversibles. Le passage à des données ou à des envois réels exige la configuration et les informations métier correspondantes.

## D16 — Date et lieu de l’exercice

À la demande de l’utilisateur le 13 novembre 2026 : fixer la date au 4 décembre 2026 (J+21), conserver 15 h comme horaire de démonstration et utiliser l’Atelier du Canal, 12 rue des Gourmands, 75010 Paris, comme lieu explicitement fictif. Les copies des sources Notion sont conservées inchangées.

## D17 — Premier aperçu accessible

Après accord de l’utilisateur pour voir la page en ligne, publication d’un aperçu statique privé distinct avec Sites. Les scripts locaux Sites restent indisponibles ; préparation par Git et archive standard, puis publication native réussie. Le formulaire de l’aperçu est clairement simulé, sans persistance, et les liens vers l’espace équipe ne sont pas exposés. Le prototype local complet reste conservé. Voir `apercu-en-ligne.md` pour l’URL et les preuves. La cible Supabase/Vercel et ses vérifications ne sont pas déclarées réalisées.

## D18 — Landing page et application PWA, 14 novembre 2026

Après relecture du sujet à la demande de l’utilisateur et accord sur la répartition : la landing page `/` présente le concours, recueille l’inscription et affiche les validations/confirmations. Les liens de gestion en sont retirés. Consultation des inscrits, rôles, futures notes et classement relèvent de l’application privée `/app/`. Un domaine commun est conservé ; ni le sujet ni la préférence utilisateur n’imposent deux hébergements.

La PWA est un choix de réalisation et non une exigence du brief. Ajout du manifeste, des icônes, du service worker limité à la coquille statique et de l’invite d’installation si le navigateur la propose. Aucun cache de données privées, jetons, mots de passe ou appels API ; pas de saisie de notes hors ligne. L’ancien accès `/equipe.html` redirige vers `/app/`. L’accès propriétaire privé de la démonstration reste inchangé. Installation native et parcours sur mobile à vérifier par l’utilisateur.

## D19 — Planification Supabase des rappels

Cron est disponible et son installation a été signalée par l’utilisateur. Préparer un worker serveur dédié et une RPC limitée aux rappels, avec horloge base, réservation atomique et lot de deux. Authentification par secret serveur distinct des comptes organisateur/jury, activation explicite après recette ; aucun Make. Les confirmations immédiates restent dans inscrire-participant. Ne jamais reprendre automatiquement les états processing, uncertain, failed ou accepted. Déploiement et exécution réelle restent à faire ; voir rappels-plan.md.

## D20 — Historique des e-mails dans la PWA

Ajouter un endpoint GET consulter-emails réservé à l’organisateur après vérification Supabase Auth et rôle serveur. Lecture seule de email_jobs et des noms/statuts associés ; aucun accès jury, aucune clé privée côté navigateur, aucun bouton de renvoi. L’onglet E-mails charge l’historique à l’ouverture et sur actualisation volontaire. Affichage des destinataires, types, échéances Paris, statuts exacts et détails (contenu, nombre de tentatives, traitement, identifiant Brevo, erreur). La livraison n’est pas suivie : accepted reste « Accepté par Brevo ». Effacer les données lors de la déconnexion, expiration ou sortie, et ignorer les réponses tardives. Cache PWA limité à la coquille statique, inchangé dans son périmètre.

## D21 — Cartes sur téléphone pour les données de la PWA

Retour utilisateur : le défilement horizontal du tableau masque les actions sur téléphone. Sous 760 px, afficher les lignes comme des cartes verticales avec libellés et action pleine largeur, pour Participants, Classement et E-mails. Conserver les tableaux sur grand écran et leurs informations sémantiques. Vérifier l’accès aux actions dans la recette mobile plutôt que déduire le responsive de la seule présence d’un conteneur défilant.
