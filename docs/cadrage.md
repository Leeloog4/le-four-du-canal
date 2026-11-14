# Le Four du Canal — cadrage de réalisation

État au 13 novembre 2026. Niveau retenu : **3 — landing page, application, e-mails**.

## Sources consultées

Les trois pages ont été lues directement dans Notion et conservées dans `sources/`.
La conversation transférée sert de contexte ; elle ne remplace pas le sujet.

| Source | Référence | Portée |
| --- | --- | --- |
| Sujet original | https://app.notion.com/p/792ec4a3bfbd83149aa181fa7271a7cb | Exigences de l’exercice, référence prioritaire |
| Note de cadrage | https://app.notion.com/p/417ec4a3bfbd81d7b738c6cf9f62c85f | Hypothèses de prototype, droits et exclusions |
| Architecture antérieure | https://app.notion.com/p/417ec4a3bfbd81c3b856f10110875bdf | Proposition technique, ajustée dans decisions.md |

Les sources Notion n’ont pas été modifiées. Le sujet autorise le code et l’IA ; aucun outil no-code n’est imposé. L’échéance « dans trois semaines » décrit le cas ; elle ne fournit pas une date réelle d’événement.

## Faits du sujet

Pâtisserie indépendante, site WordPress existant, concours amateur. Socle : page mobile, inscription simple avec validation et retour. Niveau 2 : gestion des participants, notes, classement et accès définis. Niveau 3 : confirmation et rappel, avec contenu, destinataire, déclencheur et statut réel/test/simulé explicites. Livrables : projet, README, cadrage, vérifications et démonstration courte.

## Hypothèses retenues pour avancer

- Prénom, nom et e-mail obligatoires ; aucune capacité maximale, aucun paiement.
- Un organisateur et un jury. Inscription publique sans compte participant ; équipe authentifiée.
- Trois critères **fictifs** : goût, texture, présentation. Entiers de 0 à 10, somme sur 30, sans pondération. Un jeu de notes par participant, modifiable par le seul jury.
- Ex æquo : rangs de compétition 1, 1, 3. L’ordre visuel des ex æquo n’est pas un départage.
- Classement interne accessible à l’organisateur et au jury conformément à la matrice de droits de la note.
- Confirmation après enregistrement ; rappel à J−1. Un participant tardif reçoit la confirmation mais pas de rappel rétroactif.
- Date **fictive de démonstration** : 4 décembre 2026 à 15 h, Europe/Paris (14 h UTC). Lieu fictif retenu : Atelier du Canal, 12 rue des Gourmands, 75010 Paris (lieu fictif). Cette date est configurable et n’est pas calculée à partir de l’heure du serveur.
- Page séparée ; lien depuis WordPress proposé, aucune modification du WordPress réalisée.
- Une adresse normalisée = une inscription. Une nouvelle soumission produit une erreur claire, sans nouvelle ligne ni nouveau message.
- Retrait/réactivation par l’organisateur, sans suppression ni correction des coordonnées dans cette V1. Le retrait annule les e-mails non traités et exclut du classement. La réactivation ne recrée pas d’e-mails.

## Inconnues avant utilisation réelle

Date/lieu/modalités, identité visuelle réelle, barème et nombre réel de jurés, capacité éventuelle, règles des doublons, droits définitifs, expéditeur Brevo, accès WordPress, hébergement, budget. Informations relatives au traitement des données et durée de conservation à définir. Pas de fausse réponse client, de prix ni de gain inventé.

## Limites de portée

Pas de paiement, de newsletter, de publication du classement, de refonte WordPress ni de gestion multi-jurés. Les comptes/paramètres se gèrent par configuration technique, pas dans l’interface. L’interface organisateur gère les statuts ; une correction des coordonnées reste une extension documentée. Aucune garantie de production ne découle des tests locaux.

## Couverture des exigences

| ID | Exigence source | Implémentation | Vérification |
| --- | --- | --- | --- |
| E01 | Présentation du concours | dist/index.html, informations fictives et fond gâteau | accès mobile et première présentation validés ; rendu du fond final à confirmer |
| E02 | Inscription et validation | inscrire-participant, transaction participant + messages | inscription/doublon et réception contrôlée confirmés ; atomicité testée avec substituts |
| E03 | Responsive | dist/style.css ; cartes PWA sous 760 px | landing et actions/notation mobile confirmées ; dernière augmentation typographique à apprécier |
| E04 | Liste et gestion | PWA et fonctions consulter-participants/changer-statut-participant | retrait/réactivation et visibilité par rôle confirmés |
| E05 | Notes | noter-participant + RPC save_scores ; trois entiers 0–10 | saisie/relecture et parcours téléphone confirmés ; erreurs couvertes par tests |
| E06 | Classement | PWA sur données autorisées, actifs évalués seulement | somme, ex æquo et retrait confirmés ; rangs 1/1/3 testés |
| E07 | Accès | Auth/rôles serveur, sessionStorage temporaire, tables privées | séparation des rôles et actualisation confirmées ; RLS directe externe non inspectée |
| E08 | Confirmation | email_jobs et Brevo côté serveur | réception réelle contrôlée confirmée ; états d’erreur testés avec substituts |
| E09 | Rappel | claim_reminders, traiter-rappels et Supabase Cron | rappel fictif dû traité une fois ; réception réelle du rappel non vérifiée |
| E10 | WordPress | page séparée, lien depuis WordPress proposé | articulation documentée, aucune modification WordPress réalisée |
| E11 | Livrables | README, sources, décisions, architecture, recette, guide démo | fichiers fournis ; démonstration de cinq minutes préparée, non enregistrée |

Pour chaque nouvelle fonctionnalité, mettre à jour cette couverture et `recette.md`.

## Répartition précisée le 14 novembre 2026

La landing page est limitée à la présentation, aux informations du concours, au formulaire et à sa validation/confirmation, avec adaptation mobile et articulation WordPress documentée. Consultation/gestion des inscrits, notes et classement appartiennent à l’application privée. L’utilisateur a retenu une réalisation en PWA : `/app/`, distinct de la landing `/`, sur le même domaine. Le choix PWA ne constitue pas une exigence du sujet. Les inscriptions restent stockées dans Supabase ; aucune modification des règles métier ou de la date de l’exercice n’est introduite.

## Précision demandée le 13 novembre 2026

La date est fixée à trois semaines à compter du 13 novembre 2026, soit le vendredi 4 décembre 2026. Horaire de démonstration conservé : 15 h, Europe/Paris. Le lieu fictif est l’Atelier du Canal, 12 rue des Gourmands, 75010 Paris. Ces informations servent à l’exercice et ne constituent pas une annonce réelle.

## Suivi des e-mails — PWA hébergée

E08/E09 : historique des confirmations/rappels implémenté dans dist/app et endpoint Supabase consulter-emails préparé, réservé à l’organisateur. Tests locaux lecture/droits/états réussis ; installation manuelle de cet endpoint et recette de consultation réelle encore à faire. Historique en lecture seule ; aucune reprise automatique ni renvoi depuis cette vue. Le bouton de test indépendant n’ajoute pas de message à email_jobs.

## Visibilité jury précisée par l’utilisateur

Le jury voit uniquement les participants actifs ; les retirés restent consultables et réactivables par l’organisateur. La règle s’applique dans consulter-participants côté serveur et dans la PWA, avec compteurs cohérents. Réactivation visible à l’actualisation suivante. Les notes sont conservées.

## Actualisation de la session et identité visuelle

À la demande utilisateur : session de l’onglet conservée après actualisation pendant sa durée de validité (une heure maximum), avec nouveau contrôle des droits côté serveur. Voir D24 pour le stockage sessionStorage et les limites du frontend statique. Nouveau visuel généré de gâteau et farine pour identifier le concours de pâtisserie. Ces ajustements ne changent pas les rôles, barème ou données fictives.

## Synchronisation avec Notion

Le 14 novembre 2026, la note Notion 417ec4a3bfbd81d7b738c6cf9f62c85f est mise à jour en V1 avec les décisions de réalisation et les preuves de recette. Copie de travail : note-cadrage-actualisee.md ; copie initiale dans sources/note-notion.md conservée.

## Présentation de l’échange client

À la demande de l’utilisateur, la note actualisée présente désormais les questions, les réponses client et les décisions associées dans la rubrique 4. Les choix métier restent ceux déjà retenus ; hypothèses de démonstration et points ouverts restent visibles. Les sources du brief restent conservées.
