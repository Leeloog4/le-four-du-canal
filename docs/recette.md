# Cahier de recette — état initial

Date : 13 novembre 2026. Environnement : Node 24.22.1, SQLite réel dans des dossiers temporaires, HTTP local. Aucun compte externe ni e-mail envoyé. Les tests détruisent leurs données et ne remplissent pas la base de démonstration.

## Preuves exécutées

Commandes : `npm run check` et `npm test` depuis la racine du projet.

Résultat : **20 tests réussis, 0 échec, 0 ignoré** (16 tests principaux et 4 sous-tests Brevo). Vérification syntaxique réussie. Les résultats ci-dessous sont automatisés ; ils ne valent pas inspection visuelle/manuelle du navigateur.

| ID | Scénario | Résultat observé |
| --- | --- | --- |
| R01 | Inscription valide | HTTP 201, identifiant, confirmation simulée, participant retrouvable côté organisateur |
| R02 | Champs invalides, nom trop long ou balises | HTTP 422 avec erreurs par champ, aucune ligne créée |
| R03 | Adresse identique avec casse/espaces différents | HTTP 409, une inscription et deux tâches seulement |
| R04 | Redémarrage/réouverture de base | Participant et deux tâches présents après fermeture/réouverture |
| R05 | Échec de création d’une tâche d’e-mail | Transaction annulée : aucun participant ni tâche partielle |
| R06 | Consultation anonyme des données internes | HTTP 401 pour participants, classement et e-mails |
| R07 | Jury consulte liste | Noms et notes présents, champ e-mail absent |
| R08 | Tentatives de dépassement des rôles | Organisateur écrit notes : 403 ; jury modifie statut ou lit e-mails : 403 |
| R09 | Connexion et session | Mauvais mot de passe : 401 ; cookie HttpOnly/SameSite ; session expirée refusée ; déconnexion invalide la session |
| R10 | Mutation depuis une autre origine | HTTP 403 ; pas de CORS ouvert |
| R11 | Saisie des notes | Trois entiers 0–10 requis, zéro admis ; texte, fraction, note manquante et hors barème refusés |
| R12 | Classement | Somme correcte ; scores égaux rangs 1/1/3 ; non-évalués et retirés exclus |
| R13 | Retrait | Statut modifié, rappel en attente annulé, notes supplémentaires refusées, classement mis à jour |
| R14 | Rappel avant/après J−1 | Pas de traitement anticipé ; traitement à l’échéance ; deux appels concurrents ne traitent qu’une fois |
| R15 | Inscription après l’heure prévue du rappel | Tâche marquée skipped, aucune programmation dans le passé |
| R16 | Planificateur | Sans secret : 401 ; avec secret : 200 ; rappel après l’événement ignoré |
| R17 | Brevo, substitut de réponse 201 | État accepted avec messageId ; aucune affirmation de livraison |
| R18 | Brevo, substituts 400 / erreur réseau / 503 | failed / uncertain / uncertain ; aucun renvoi automatique et aucun vrai appel externe |
| R19 | Pages et exposition des fichiers | Page, espace équipe et trois assets HTTP 200 ; .env et source serveur HTTP 404 ; CSP présente |
| R20 | Configuration invalide | Brevo ou Supabase incomplets refusés ; SQLite sur Vercel refusé ; date invalide refusée |
| R21 | Contrat de fonction serverless, requête déjà décodée | Corps objet accepté, JSON invalide refusé et limite de 16 Ko appliquée ; exécution Vercel réelle non vérifiée |

Les lignes sont des critères de recette ; leur nombre ne correspond pas au nombre de tests, car certains tests couvrent plusieurs critères.

## Recette manuelle à faire dans un navigateur

Statut : **non exécutée**. L’environnement n’expose pas le chemin de contrôle navigateur requis ; aucun résultat visuel ni capture n’est inventé.

| ID | Manipulation | Attendu |
| --- | --- | --- |
| M01 | Ouvrir la page à 1440 px et 390 px | Contenu lisible, aucun débordement de page ; date fictive et simulation explicites |
| M02 | Naviguer au clavier, soumettre champ vide puis valide | Labels, focus et validation utilisables ; retour de confirmation annoncé |
| M03 | Inscrire Camille, se connecter comme organisateur | Camille visible, coordonnées exactes, notes non modifiables |
| M04 | Se reconnecter comme jury et noter 8/9/7 | Aucune adresse e-mail visible ; score 24/30 ; dialogue utilisable avec clavier et Échap |
| M05 | Évaluer un autre participant à total 24 | Deux participants ex æquo au même rang |
| M06 | Revenir comme organisateur, consulter e-mails puis retirer Camille | Contenus, destinataires et statut simulé lisibles ; rappel annulé et classement recalculé |
| M07 | Rafraîchir, se déconnecter, utiliser retour navigateur | API interne refusée sans session ; nouvelles vues ne rendent pas de données privées |

## Recette externe à faire après configuration

| ID | Vérification | Statut actuel |
| --- | --- | --- |
| X01 | Appliquer SQL dans Supabase ; tester Auth et transactions | Non exécuté, aucun accès configuré |
| X02 | Vérifier tables et RPC avec clé anon et jeton utilisateur | Non exécuté ; attendu : refus, même pour un compte connecté |
| X03 | Tester deux comptes via l’application déployée | Non exécuté |
| X04 | Envoyer une confirmation à une adresse contrôlée | Non exécuté ; aucun envoi réel revendiqué |
| X05 | Tester rappel via planificateur, application fermée | Non exécuté ; horaire et forfait à vérifier |
| X06 | Contrôler journal Brevo et réception du message | Non exécuté ; accepted ne vaut pas delivered |
| X07 | Vérifier persistance, cookies HTTPS et limites de durée Vercel | Non exécuté |
| X08 | Tester lien WordPress réel | Non exécuté ; aucun accès WordPress |

## Règle de mise à jour

### État courant — confirmation automatique validée, 14 novembre 2026

Les entrées plus anciennes ci-dessous décrivent les étapes historiques, pas l’état courant.

- L’utilisateur signale le déploiement manuel de la nouvelle fonction inscrire-participant.
- Nouvelle inscription avec une adresse contrôlée : succès et réception de la confirmation confirmés par l’utilisateur.
- Consultation de email_jobs : confirmation accepted et rappel pending au 3 décembre 2026 à 14 h UTC (15 h Paris), tous deux confirmés par l’utilisateur.
- Nouvelle soumission avec la même adresse : l’utilisateur confirme le scénario de refus du doublon. Texte exact du retour, comptage des lignes et absence de nouvel appel fournisseur non inspectés indépendamment par l’agent.
- Aucun accès de l’agent à la boîte de réception, aux secrets ou au schéma authentifié. Aucun envoi effectué par l’agent.
- Rappel automatique toujours NON activé : le statut pending constitue une tâche enregistrée, pas une preuve de planification ni d’envoi.


Raccordement GitHub : dépôt Leeloog4/le-four-du-canal fourni par l’utilisateur. Métadonnées vérifiées : privé, vide, droits de push ; aucun historique distant à remplacer. Source consolidée choisie comme référence, historique Sites conservé, clés/base/export exclus. Le raccordement ne modifie pas le déploiement Supabase ou Sites et n’active aucun envoi d’e-mail.

Consolidation GitHub préparée le 14 novembre 2026 dans un dépôt local unique : historique Git du site conservé (9 commits avant consolidation), site/PWA, fonctions Supabase, SQL, documentation, tests et archive du prototype réunis. `npm run check`, `npm test` (86 réussis) et `npm run test:local` (20 réussis) exécutés avec succès. Contrôle ciblé de 73 fichiers texte sans secret reconnaissable ni base locale. Aucune modification de la démonstration hébergée par cette consolidation. GitHub distant non créé : intégration GitHub non encore ajoutée/autorisée ; proposition disponible pour l’utilisateur.

Confirmation automatique préparée localement, non encore déployée dans Supabase : 15 tests ciblés réussis avec substituts (transaction, destinataire, simulation, acceptation/refus/incertitude, inscription conservée, résultat écrit en base, concurrence et rappel tardif). Affichage compatible des statuts publié au commit `ee5af4209c40ab51069f0d9606812c9a67b31371`, résultat natif succeeded ; suite Site 37 tests réussis. Aucun nouvel envoi réel par l’agent. Git distant vérifié : Sites, pas GitHub ; sources backend/SQL non encore réunies dans le dépôt publié.

Préparation du workflow e-mail SQL : inscription + deux tâches atomiques, réclamation concurrente des messages dus, retrait annulant les tâches en attente. Aucune exécution directe par l’agent, aucun message inséré ou envoyé. Script à appliquer par l’utilisateur ; automatisation toujours non activée.

Test Brevo réel : l’utilisateur confirme avoir reçu « [TEST] Le Four du Canal — vérification e-mail » après le clic manuel dans la PWA. Réception confirmée par sa recette, sans accès de l’agent à sa messagerie ni aux clés. Confirmation et rappel automatiques non activés. Table email_jobs préparée, création non encore confirmée.

Test e-mail publié, commit `da85d236b684bb9759c4e280ba6f129dc06c51c7`, résultat natif succeeded. Endpoint réellement contrôlé sans envoi : prévol 204, anonyme 401, jeton invalide 401. Suite Site : 36 tests réussis avec substituts. Aucun envoi fournisseur par l’agent ; premier test manuel et réception réelle en attente. Confirmations/rappels automatiques non activés.

Brevo — préparation seulement : expéditeur vérifié et Secrets Supabase signalés comme configurés par l’utilisateur, sans accès aux valeurs par l’agent. Fonction de test préparée ; 9 tests locaux avec réseau substitué réussis : connexion/rôle, destinataire imposé serveur, acceptation distincte de livraison, secrets absents, refus/erreur/interruption sans reprise. Aucun e-mail réel envoyé. Déploiement, bouton de test et réception restent à vérifier.

Gestion réelle validée par l’utilisateur : Alex retiré, statut Retiré visible et absent du classement, puis réactivé avec ses notes conservées (24/30) et son rang 1 ex æquo retrouvé sans ressaisie. Recette manuelle retrait/réactivation complète. Les e-mails restent non activés, aucun envoi ou programmation réelle revendiqué.

Gestion des participants publiée au commit `069f43469a2a22fb48a51f2fac24e6896ea97c78`, résultat natif succeeded. Fonction réellement contrôlée sans écriture : OPTIONS 204, anonyme 401, jeton invalide 401. Suite Site : 32 tests réussis avec substituts, dont retrait/réactivation, conservation des notes et recalcul, annulation, droits, erreurs, relecture et réponses tardives. Contrôle réel avec Alex en attente de recette utilisateur. Aucun e-mail actif ni donnée réelle modifiée par l’agent.

Gestion des inscrits en préparation : 8 tests locaux réussis de changer-statut-participant avec réseau substitué (connexion/jeton, refus jury, retrait/réactivation sans modification des notes, validation, erreurs). Aucun déploiement de cette fonction ni retrait réel encore vérifié.

Ex æquo réels confirmés par l’utilisateur : Camille et Alex tous deux rang « 1 ex æquo », 24/30, après le scénario indiqué (Camille 8/9/7 et Alex 10/6/8). Gestion des statuts encore en préparation ; aucun retrait ou e-mail réalisé par l’agent.

Classement réel confirmé par l’utilisateur : Camille Martin au rang 1 avec 24/30. Recette navigateur du cas nominal validée ; égalité entre deux participations encore à vérifier manuellement, déjà couverte par les tests automatisés.

Lecture seule des évaluations par l’organisateur confirmée par l’utilisateur : Camille 24/30 visible, boutons de notation absents. Classement interne publié ensuite : commit `1c85e345c6a27533fa8d56d2a90fd9c0068469d5`, résultat natif succeeded. 26 tests du Site réussis, dont tri/ex æquo 1/1/3, actifs évalués uniquement, zéro accepté, deux rôles, absence de coordonnées, recalcul et effacement à la déconnexion. Contrôle réel de l’onglet Classement encore à effectuer par l’utilisateur. Aucune donnée supplémentaire créée par l’agent.

Notation réelle validée par l’utilisateur : jury → Camille → 8/9/7 → message 24/30, valeurs conservées après actualisation et préremplies à la modification. Écriture et relecture authentifiées confirmées par sa recette navigateur. Lecture seule des notes via compte organisateur non encore confirmée manuellement. Classement et e-mails restent les prochaines étapes.

Notation PWA publiée : résultat natif succeeded, commit `324cce3d7b75a574a412669eaf4aaab8db608154`. 22 tests du Site réussis avec substituts, dont nouveaux cas de saisie et relecture des notes, zéro/modification, organisateur en lecture seule, valeurs invalides, résultat réseau incertain, lecture non confirmée, double clic et déconnexion pendant écriture. API de notation et consultation : 401 sans session, contrôlé réellement. Écriture authentifiée 8/9/7 pour Camille et rechargement en base encore à confirmer par la recette utilisateur. Aucun classement ou e-mail actif ajouté.

Notation — contrôles réels sans écriture : noter-participant répond OPTIONS 204, POST anonyme 401 et jeton invalide 401. Mise à jour de consultation préparée pour recharger les notes ; 17 tests locaux de consultation/notation réussis avec réponses substituées. Déploiement de cette mise à jour, interface PWA et écriture authentifiée encore à faire.

Notation : création de `scores` confirmée par l’utilisateur. Fonction SQL d’enregistrement et fonction de bord préparées, sans déploiement confirmé. 10 tests locaux avec réponses substituées de `noter-participant` réussis : accès anonyme/session invalide, refus organisateur, barème et complétude, total et identité jury serveur, zéro, erreurs participant absent/retiré/droits/barème. Aucune insertion réelle de note et aucune saisie dans la PWA encore vérifiées.

14 novembre 2026 — jury : l’utilisateur confirme les deux rôles SQL, puis la connexion avec le compte jury, l’affichage du rôle Jury et de Camille Martin sans son adresse e-mail. Recette manuelle de séparation des rôles validée par l’utilisateur. Table scores en cours de préparation ; aucune notation réelle encore enregistrée ou revendiquée dans la PWA.

14 novembre 2026 — recette utilisateur PWA : présence de Camille Martin dans l’application `/app/` confirmée, puis installation sur Chrome ordinateur confirmée. Il s’agit d’observations utilisateur ; installation mobile et lancement depuis l’icône n’ont pas été testés séparément. La notation n’est pas encore proposée dans la version hébergée.

14 novembre 2026 — séparation landing/PWA : 16 tests du Site réussis, dont 4 nouveaux contrôles du manifeste/icônes, retrait des liens de gestion de la landing, redirection de l’ancien accès, absence d’interception des API et coquille hors ligne sans données. Syntaxe et ressources des pages vérifiées. Publication native `succeeded`, commit `295a76a6a1b98f41eeb7ae15c7fd923038af10ac`, déploiement `appgdep_6af797a879a4819182b276103666bdc0`. Installation PWA et contrôle visuel mobile non exécutés ; connexion/lecture sur la nouvelle adresse à confirmer par l’utilisateur. Ni notes ni classement hébergés ajoutés à cette étape.

Déconnexion de l’espace équipe confirmée manuellement par l’utilisateur : disparition de la liste et retour du formulaire de connexion. Le parcours inscription → lecture organisateur → déconnexion est validé par ses observations. La révocation réseau n’a pas été inspectée séparément par l’agent.

Recette utilisateur de l’espace équipe : connexion avec le compte organisateur et présence de Camille Martin dans la liste explicitement confirmées par l’utilisateur. Authentification, autorisation et lecture de l’inscription validées par ses observations. Déconnexion dans le navigateur non encore confirmée.

Espace équipe publié au commit `458ccd8766629985c04730f4ddf3564610cb89ea` : résultat natif `succeeded`. Endpoint de consultation réellement vérifié : prévol 204, sans connexion 401, jeton invalide 401. Suite du Site : 12 tests réussis avec substituts (formulaire + connexion, refus d’accès, déconnexion/expiration, réponse tardive et minimisation jury). La connexion réelle du compte organisateur et la lecture de sa liste attendent la recette utilisateur. E-mails toujours non activés.

Préparation espace équipe : rôle `organizer` confirmé par l’utilisateur après exécution SQL. 6 tests de la nouvelle fonction `consulter-participants` réussis localement avec réseau substitué ; authentification réelle et consultation sur Site non testées. Fonction pas encore déployée. Aucune nouvelle fonctionnalité équipe en ligne annoncée comme opérationnelle.

Recette utilisateur sur le Site connecté à Supabase : confirmation « participation enregistrée », présence de Camille Martin / camille@example.test dans participants, puis refus d’une seconde soumission avec cette adresse, tous confirmés par l’utilisateur dans la conversation. Parcours nominal et message de doublon validés manuellement par l’utilisateur ; pas de comptage indépendant de lignes par l’agent. E-mails toujours non activés.

Étape guidée de connexion Supabase : OPTIONS réel → 204, POST vide → 422, aucune insertion. 5 tests supplémentaires du formulaire hébergé, avec réseau substitué, réussis dans `/workspace/sites/four-du-canal-demo/tests/form.test.mjs`. Site republié avec succès au commit `bd96154606546ad8f99f43bcbbbbdf7a8e698613`. L’inscription réelle et la présence de la ligne en base restent à confirmer par l’utilisateur. E-mails non activés. Détails dans `connexion-supabase-guidee.md`.

Aperçu distinct publié le 13 novembre 2026 via Sites : https://four-du-canal-exercice.leeloog4.chatgpt.site — résultat natif `succeeded`, privé. Vérifications statiques réussies ; rendu navigateur toujours non vérifié. Le formulaire de cette version est explicitement simulé, sans enregistrement ni e-mail. Cette publication ne valide pas les intégrations externes X01–X08. Détails : `apercu-en-ligne.md`.

Modification du 13 novembre 2026 : date à J+21 (4 décembre 2026 à 15 h, Paris) et lieu fictif Atelier du Canal. Vérification ciblée exécutée : calcul des 21 jours, date UTC, mention fictive et cohérence du lieu entre configuration et HTML. Résultat : réussi. Aucun contrôle visuel supplémentaire effectué.

Après chaque changement, rattacher l’exigence, noter la commande ou manipulation, le résultat réel et la limite de vérification. Ne pas transformer un test avec substitut en preuve d’intégration fournisseur.
