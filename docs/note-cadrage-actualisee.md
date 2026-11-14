# Note de cadrage — Niveau 3

Copie de travail de la note Notion actualisée le 14 novembre 2026 : https://app.notion.com/p/417ec4a3bfbd81d7b738c6cf9f62c85f . Les copies initiales dans docs/sources restent inchangées.

## 1. Référence

- **Projet :** Concours amateur de pâtisserie — Le Four du Canal
- **Type :** Landing page, application de gestion du concours et e-mails
- **Version :** V1 — décisions de réalisation et recette actualisées le 2026-11-14
- **Statut :** Prototype de niveau 3 réalisé et vérifié selon les hypothèses retenues pour l’exercice. Aucun arbitrage réel du client n’est inventé ; les paramètres métier et la mise en production restent à valider.

## 2. Contexte

Le Four du Canal est une pâtisserie indépendante qui organise un concours amateur de pâtisserie dans trois semaines. Son site existe sous WordPress. Le client ne sait pas s’il faut ajouter une page dédiée au site ou créer une page séparée.

Le brief mentionne trois besoins : présenter le concours et recueillir les inscriptions, suivre les participants et leurs notes, puis envoyer des e-mails liés à l’événement.

## 3. Besoin / enjeux

**Besoin exprimé :** disposer d’une solution numérique pour présenter le concours, inscrire les participants, aider l’équipe à gérer les candidatures et les notes du jury, afficher un classement et communiquer par e-mail.

**Enjeux :**

- Rendre le parcours d’inscription simple et compréhensible.
- Centraliser les informations utiles à l’organisation.
- Appliquer des règles de notation et de classement cohérentes.
- Éviter les erreurs de saisie et les communications manuelles oubliées.
- Livrer une solution démontrable avant l’événement.

**Objectif de réussite proposé :** un participant peut s’inscrire et voit une confirmation ; une personne autorisée peut consulter les inscriptions, saisir les notes selon les critères retenus et obtenir le classement calculé selon les règles validées ; les deux e-mails prévus sont testés ou leur simulation est clairement identifiée.

## 4. Compréhension du besoin

Le périmètre retenu pour l’exercice est le **niveau 3** du brief : landing page, petite application et e-mails.

**Parcours cible envisagé :**

1. Le participant consulte la page et remplit le formulaire.
2. Le système vérifie les champs obligatoires et enregistre l’inscription.
3. Le participant reçoit une confirmation, ou un retour de test/simulation clairement indiqué.
4. L’équipe autorisée consulte les participants dans l’application.
5. Le jury saisit les notes selon les critères définis.
6. L’application calcule et affiche le classement.
7. Un rappel est traité à l’échéance par le planificateur serveur ; son état réel, simulé ou en erreur est explicite. Le traitement planifié a été vérifié sur une adresse fictive, sans livraison réelle de rappel revendiquée.

**Réponses du client :** aucune réponse n’est fournie dans le cas pratique. Pour pouvoir réaliser le prototype, les hypothèses provisoires suivantes sont retenues : inscription avec prénom, nom et e-mail ; pas de limite d’inscription ; trois critères de démonstration notés sur 10, score final par somme ; ex æquo en cas de score identique ; classement réservé à l’équipe ; un rôle organisateur et un rôle jury ; confirmation après inscription et rappel programmé 24 h avant l’événement. Ces hypothèses ne sont pas des réponses du client et devront être remplacées si le besoin réel diffère.

## 5. Nombre d’utilisateurs

Le nombre n’est pas indiqué dans le brief.

- **Externes :** participants ; nombre maximal à confirmer.
- **Internes :** organisateur(s) et membre(s) du jury ; nombre à confirmer.
- **Hypothèse de prototype :** un compte organisateur et un compte jury pour démontrer les deux rôles, avec des données fictives. Le nombre réel de participants et d’utilisateurs internes reste inconnu.

## 6. Profils utilisateurs

- **Participant :** consulte les informations du concours et soumet une inscription.
- **Organisateur :** consulte et gère les participants ; supervise l’application.
- **Membre du jury :** consulte les informations nécessaires et saisit les notes.
- **Administrateur du prototype :** configure les outils et les accès pour la démonstration.

**À confirmer :** les rôles peuvent être regroupés ou séparés selon l’organisation réelle.

## 7. Droits d’accès

Légende : **L** = lecture, **C** = création, **M** = modification, **S** = suppression.

| Données / fonctions | Participant | Organisateur | Jury |
| --- | --- | --- | --- |
| Informations publiques du concours | L | L | L |
| Création d’une inscription | C | — | — |
| Liste des participants | — | L de tous les inscrits ; M des statuts | L des actifs uniquement, sans adresse e-mail |
| Notes du jury | — | L | C, M |
| Classement interne | — | L | L |
| Historique des confirmations et rappels | — | L, détails et statuts | — |
| Comptes et paramètres | — | — dans l’application ; configuration technique séparée | — |

**Règles retenues et appliquées :** un compte organisateur et un compte jury authentifiés, droits vérifiés côté serveur. Le classement reste interne aux deux rôles. Le jury voit uniquement les participants actifs et ne reçoit ni leurs adresses ni l’historique des e-mails ; seul le jury écrit les notes. L’organisateur consulte les notes en lecture seule, voit les actifs et retirés et peut retirer/réactiver. Aucune suppression ni modification des coordonnées dans cette V1. Le participant ne consulte aucune donnée interne. La séparation des rôles a été vérifiée par la recette utilisateur et les tests automatisés.

## 8. Contraintes opérationnelles

**Confirmé par le brief :**

- Le concours a lieu dans trois semaines.
- Le site WordPress existe.
- Les détails du concours et les outils utilisés ne sont pas tous précisés.
- Le niveau 3 est visé pour l’exercice.

**Inconnues du sujet :** date et lieu réels, capacité, identité visuelle réelle, accès WordPress et règles réelles de notation restent à confirmer. Pour l’exercice : aucune capacité maximale ; concours fictif le 2026-12-04 à 15:00 (Europe/Paris) ; lieu fictif « Atelier du Canal, 12 rue des Gourmands, 75010 Paris ». La date a été fixée à trois semaines du 13 novembre, puis conservée sans recalcul. Rappel prévu le 2026-12-03 à 15:00 (Europe/Paris) (14 h UTC). Landing hébergée séparément ; lien depuis WordPress proposé, aucune modification WordPress réalisée. Expéditeur Brevo et secrets configurés pour la démonstration, sans publication de leurs valeurs.

La proximité de l’événement impose de prioriser un parcours complet et vérifiable. Les détails graphiques ou fonctions supplémentaires ne doivent pas retarder l’inscription, la saisie des notes, le calcul du classement ou les e-mails.

## 9. Gestion des données

**Données du prototype :**

- Participant : prénom, nom, e-mail, statut d’inscription et date de création.
- Notation : goût, texture et présentation sont trois critères explicitement fictifs. Trois entiers de 0 à 10 sont obligatoires, somme sur 30 ; un jeu de notes par participant, modifiable par le compte jury. Seuls les actifs entièrement évalués figurent au classement, par somme décroissante. Les égalités gardent les rangs de compétition 1/1/3 ; aucun départage ni calcul multi-jurés inventé.
- Comptes internes : e-mail et rôle (organisateur ou jury).
- E-mails : destinataire, confirmation/rappel, objet, contenu, échéance, tentatives de traitement, état, date de traitement, identifiant Brevo et information d’erreur. États : en attente, en cours, simulé, accepté par Brevo, échec, résultat incertain ou non envoyé. « Accepté par Brevo » ne signifie pas livré ; aucun suivi de livraison par webhook dans cette V1.
- Concours : date et heure fictives de démonstration, à remplacer par la date réelle.

Les coordonnées des participants et les comptes de l’équipe sont des données personnelles. Le prototype minimise les champs en ne demandant que prénom, nom et e-mail. L’âge, les coordonnées d’un responsable légal ou toute donnée sensible ne sont pas collectés.

**À définir avant une mise en production :** responsable du traitement, information des participants, base légale, durée de conservation, modalités de suppression ou d’export et conditions d’accès. Le prototype utilisera de préférence des données fictives pour la démonstration.

## 10. Périmètre

- Landing page responsive consacrée au concours : présentation, informations fictives signalées, formulaire et confirmation. Visuel généré de gâteau avec projections de farine en fond pleine largeur de l’accueil, texte superposé et voile de contraste. Aucun tableau de gestion ou classement public sur la landing.
- Formulaire d’inscription avec validation des champs et retour après soumission.
- Stockage des inscriptions.
- Application privée en PWA, distincte de la landing, accessible aux comptes organisateur et jury. PWA choisie pour l’exercice, sans exigence d’application native. Internet nécessaire ; aucune saisie de notes hors ligne.
- Consultation et gestion dans la PWA : statuts inscrit/retiré ; retrait conservant données et notes, excluant le classement et annulant les messages encore en attente. Réactivation conservant les notes, sans recréer les e-mails annulés. Jury limité aux actifs.
- Saisie des notes du jury sur trois critères de démonstration notés sur 10.
- Calcul du total par somme et affichage du classement interne ; les ex æquo sont conservés en cas d’égalité.
- E-mail de confirmation d’inscription.
- E-mail de rappel avant l’événement.
- Tests manuels du parcours principal et de cas d’erreur essentiels.
- README et courte démonstration.
- Explication de l’articulation avec le site WordPress existant.

## 11. Exclusions

Sauf demande confirmée, le projet n’inclut pas :

- La refonte du site WordPress.
- Un système de paiement, une billetterie ou une gestion de remboursement.
- Une application mobile native.
- Une publication publique du classement.
- Des campagnes marketing ou une newsletter.
- Des statistiques avancées.
- Des intégrations avec des outils du client qui ne sont pas encore identifiés.
- Une garantie de production ou de sécurité professionnelle au-delà du prototype présenté.

## 12. Fonctions principales

| Fonction | Objectif / utilisateurs | Données et règles | Limites actuelles |
| --- | --- | --- | --- |
| Présenter le concours | Informer les participants | Landing, date/lieu fictifs, visuel gâteau et formulaire | Informations réelles à confirmer ; rendu du dernier fond à vérifier sur les écrans |
| Inscrire un participant | Permettre une inscription simple | Prénom, nom, e-mail ; adresse normalisée unique ; transaction inscription + deux tâches e-mail | Aucun paiement, capacité ou liste d’attente ; doublon refusé sans nouvelle inscription |
| Confirmer l’inscription | Informer de l’enregistrement | Brevo côté serveur après enregistrement ; destinataire de l’inscription | Réception réelle confirmée sur une adresse contrôlée ; adresses réservées simulées ; une panne e-mail n’annule pas l’inscription |
| Gérer les participants | Organisateur et jury selon leurs droits | Organisateur : actifs/retirés et retrait/réactivation ; jury : actifs sans adresses | Pas de suppression ni correction des coordonnées dans la V1 |
| Saisir les notes | Permettre l’évaluation par le jury | Trois critères fictifs, chacun noté de 0 à 10 ; compte jury authentifié | Règle provisoire de démonstration, à remplacer par le barème réel |
| Calculer le classement | Organisateur et jury | Actifs avec trois notes ; somme sur 30 ; ex æquo 1/1/3 | Classement interne, un seul compte jury de démonstration |
| Envoyer un rappel | Rappeler l’événement aux actifs | Tâche J−1 dans Supabase ; Cron chaque minute appelle une fonction serveur, sans Make | Rappel dû fictif traité une fois en simulation ; réception réelle non encore vérifiée ; pas de rappel rétroactif ni après l’événement |

## 13. Stack

**Stack retenue et utilisée :**

- Codex : assistance à la conception, réalisation par parcours et vérifications.
- GitHub : dépôt privé de référence et historique du site, de la PWA, des fonctions, SQL et documents.
- Sites : hébergement statique de la landing et de la PWA ; remplace Vercel, proposé initialement mais non utilisé pour la version active.
- Supabase : PostgreSQL, Auth des deux rôles, fonctions serveur, Cron et Vault.
- Brevo : e-mails transactionnels appelés uniquement côté serveur.
- Aucun Make.

La PWA affiche les listes en cartes sous 760 px pour rendre les actions visibles sans défilement horizontal. Textes courants agrandis, champs de notation et boutons adaptés au tactile. Installation sur Chrome ordinateur confirmée ; installation sur téléphone non vérifiée séparément.

La connexion est conservée après actualisation dans le même onglet jusqu’à l’échéance initiale, une heure maximum, ou la déconnexion explicite. Seuls le jeton temporaire et son échéance sont conservés dans sessionStorage ; jamais le mot de passe, un refresh token ou les données métier. Les droits sont revérifiés côté serveur avant affichage. Actualisation connectée et déconnexion suivie d’actualisation ont été confirmées par l’utilisateur. Le stockage reste accessible au JavaScript de l’origine, contrairement à un cookie HttpOnly.

Le service worker cache uniquement la coquille statique ; aucun jeton, participant, note ou appel API n’y est mis en cache. Les clés privées Supabase et Brevo restent côté serveur ; seule la clé Supabase publiable est dans le client. Internet est requis pour lire et écrire les données.

La confirmation est tentée après l’inscription réussie. Le rappel reste dans une file métier jusqu’à l’échéance ; les tâches dues sont réservées atomiquement, au maximum deux par appel Cron chaque minute. Aucun renvoi automatique après acceptation, échec, traitement interrompu ou résultat incertain. Un échec e-mail ne remet pas en cause l’inscription. Les adresses réservées (.test notamment) restent simulées.
## 14. Prérequis

| Prérequis | Responsable | Échéance | Bloquant pour le prototype ? | Conséquence si absent |
| --- | --- | --- | --- | --- |
| Date, lieu et contenus réels du concours | Client (absents du cas) | Avant toute mise en production | Non | Valeurs fictives signalées pour la démo |
| Champs d’inscription et capacité réelle | Client (absents du cas) | Avant mise en production | Non | Prototype avec prénom, nom, e-mail et sans limite |
| Critères, barème et départage réels | Client / jury (absents du cas) | Avant utilisation réelle | Non | Trois critères fictifs, somme sur 30, ex æquo |
| Rôles réels des organisateurs et jurés | Client (absents du cas) | Avant utilisation réelle | Non | Un compte démo par rôle |
| Contenu et horaire des e-mails | Client (absents du cas) | Avant envoi réel | Non | Contenu et date fictifs, envoi test/simulé |
| Accès WordPress | Client / gestionnaire du site | Avant intégration | Non pour la démo séparée | Page séparée, lien d’intégration proposé |
| Accès aux comptes techniques | Porteur du projet | Avant déploiement | Oui pour déploiement externe | Exécution locale ou démonstration simulée |

## 15. Organisation

- **Mode de travail :** cadrage, validation du plan, construction par petites fonctionnalités et vérification à chaque étape.
- **Responsable produit / réalisation :** à identifier dans l’exercice.
- **Validation métier :** client, organisateur et jury selon les sujets.
- **Données de démonstration :** fictives tant que les données réelles ne sont pas nécessaires et autorisées.
- **Mise en production :** non définie dans le brief ; le prototype ne sera pas présenté comme une solution de production sans validation.

## 16. Parties prenantes

- Le Four du Canal : commanditaire et valideur métier.
- Les participants : utilisateurs de la landing page et du formulaire.
- L’organisateur ou l’équipe organisatrice : gestion des inscriptions.
- Le jury : saisie des notes et validation des règles de classement.
- Le gestionnaire WordPress : interlocuteur éventuel pour l’intégration.
- Le porteur du projet : conception, réalisation, tests et documentation.

Les noms et responsabilités des interlocuteurs ne sont pas fournis.

## 17. Budget

Aucun budget n’est indiqué dans le brief.

À chiffrer après validation des outils et de leurs conditions :

- **Coûts initiaux :** conception et réalisation.
- **Coûts récurrents :** hébergement, base de données, nom de domaine ou abonnements éventuels.
- **Coûts variables :** volume d’e-mails ou dépassements de quotas.

Pour l’exercice, les coûts d’outils seront consignés séparément du temps de réalisation. Aucun montant n’est inventé dans cette note ; les coûts effectivement engagés ne sont pas établis ici.

## 18. Planning / jalons

Le concours est annoncé dans trois semaines, mais le brief ne précise ni sa date exacte ni le temps disponible pour le prototype. Planning indicatif :

1. Consigner les inconnues et valider les hypothèses de démonstration — cadrage.
2. Préparer le projet, le modèle de données et les accès — avant l’interface.
3. Construire la landing page et le formulaire — premier parcours complet.
4. Construire l’espace interne, les notes fictives et le classement — selon les hypothèses retenues.
5. Brancher ou simuler la confirmation et le rappel — avec le statut correctement indiqué.
6. Vérifier le parcours, corriger et préparer README et démonstration.

La démonstration est publiée en accès privé propriétaire et les fonctions Supabase ont été installées manuellement au cours de la recette. Le README et le scénario de démonstration sont préparés. La répétition et l’enregistrement final ne sont pas encore confirmés ; l’accès d’un évaluateur externe reste à organiser sans partager de mot de passe propriétaire.

## 19. Instances de suivi

Le brief ne définit pas de réunions. Proposition minimale :

- Un point de validation du cadrage et des règles de notation.
- Une validation du parcours de démonstration avant livraison.

Participants et dates : à confirmer. Pour l’exercice, les décisions et points en attente seront consignés dans la note.

## 20. Activités du projet

- Analyser le brief et lister les inconnues.
- Valider les règles d’inscription, d’évaluation et de classement.
- Définir les rôles et droits d’accès.
- Concevoir le parcours participant et le parcours organisateur.
- Préparer les contenus et les messages e-mail.
- Créer le modèle de données.
- Construire le site, l’application et les e-mails.
- Tester les cas nominaux et les erreurs essentielles.
- Corriger les anomalies constatées.
- Rédiger le README et présenter une démonstration.

## 21. Support

Le sujet ne précise aucun support après l’exercice ou l’événement.

Pour le prototype, le support se limite à :

- Un README avec les instructions pour lancer le projet.
- La description des fonctions réellement opérationnelles.
- Les limites, hypothèses et éléments simulés ou non vérifiés.
- Une courte démonstration du parcours principal.

Durée, canal, délai de réponse et couverture d’un éventuel support après mise en ligne : à définir.

## Hypothèses retenues et points restant avant usage réel

Les hypothèses de démonstration retenues sont : prénom/nom/e-mail, aucune limite d’inscription, trois critères fictifs notés sur 10, total par somme, ex æquo en cas d’égalité, classement interne, un compte organisateur et un compte jury, confirmation après inscription, rappel 24 h avant l’événement, page séparée reliée à WordPress par un lien. Ces choix guident le modèle de données, l’interface et les tests ; ils ne valent pas validation par le client. Avant un usage réel, il faudra remplacer les valeurs fictives par les règles et contenus confirmés.

**Conformité :** cette note suit les 21 rubriques du template de cadrage indiqué dans les consignes du projet. Elle distingue les éléments du sujet, les recommandations et les informations absentes. Les hypothèses sont retenues pour guider ce prototype ; elles restent à confirmer avec le client avant usage réel. La mise à jour conserve la structure initiale et remplace les propositions techniques devenues obsolètes par les décisions effectivement prises.

## Bilan de réalisation et de recette

Mise à jour du 2026-11-14. Les décisions ci-dessus sont celles du prototype d’exercice ; aucune réponse client supplémentaire n’a été obtenue.

| Parcours | Résultat et niveau de preuve |
| --- | --- |
| Inscription et doublon | Enregistrement dans Supabase, confirmation reçue sur une adresse contrôlée et refus du doublon confirmés par l’utilisateur |
| Organisateur et jury | Lecture, notes, classement et ex æquo vérifiés ; retirés masqués pour le jury et conservés avec réactivation pour l’organisateur ; historique des e-mails réservé à l’organisateur |
| Mobile | Landing lisible et champs vides bloqués ; actions rendues visibles en cartes ; saisie des notes sur téléphone confirmée. Dernière augmentation typographique et fond gâteau à apprécier sur les écrans |
| Session | Connexion maintenue après actualisation ; après déconnexion puis actualisation, formulaire de connexion toujours affiché ; recette utilisateur confirmée |
| Confirmation Brevo | Message de test et confirmation d’inscription réellement reçus selon l’utilisateur ; accepted reste distinct de la livraison |
| Rappel | Cron configuré ; capture SQL d’un rappel fictif dû : simulated, attempts = 1, message_id vide et date de traitement renseignée. Seconde lecture toujours à une tentative. Cela vérifie un traitement simulé, sans prouver la réception d’un rappel réel |
| Tests automatisés | Dernière suite : 139 tests réussis et syntaxe vérifiée. Appels réseau remplacés dans les tests, aucun envoi réel par cette suite |

**Ce qui reste à faire ou à confirmer :** rendu final du fond gâteau sur ordinateur et téléphone ; répétition/enregistrement de la démonstration ; accès de l’évaluateur aux liens privés ; réception effective du rappel réel à son échéance. WordPress n’a pas été modifié. Les conditions de production, informations réelles, durée de conservation et coûts restent à définir. Ces points ne sont pas présentés comme déjà réalisés.

## Liens du projet et traçabilité

- [Landing page](https://four-du-canal-exercice.leeloog4.chatgpt.site/) : présentation et inscription.
- [Application PWA](https://four-du-canal-exercice.leeloog4.chatgpt.site/app/) : participants, notes, classement et historique organisateur.
- [Code et README](https://github.com/Leeloog4/le-four-du-canal) : dépôt GitHub privé, branche main.
- [Décisions détaillées](https://github.com/Leeloog4/le-four-du-canal/blob/main/docs/decisions.md).
- [Cahier de recette](https://github.com/Leeloog4/le-four-du-canal/blob/main/docs/recette.md).
- [Architecture hébergée actuelle](https://github.com/Leeloog4/le-four-du-canal/blob/main/docs/architecture-hebergee.md).
- [Scénario de démonstration de cinq minutes](https://github.com/Leeloog4/le-four-du-canal/blob/main/docs/demo.md).

Les deux pages hébergées restent en accès privé propriétaire, distinct des rôles métier Supabase ; elles ne sont pas encore ouvertes aux participants réels ou à tout évaluateur externe. GitHub est également privé. Aucun mot de passe ni secret n’est inclus dans cette note.

Sources conservées : [Sujet original — Le Four du Canal](https://app.notion.com/p/792ec4a3bfbd83149aa181fa7271a7cb) ; [Proposition d’architecture initiale](https://app.notion.com/p/417ec4a3bfbd81c3b856f10110875bdf). Cette proposition reste une source historique ; l’architecture active est documentée dans GitHub.

**Évolution du cadrage :** V0 conservait les inconnues du brief et les hypothèses choisies pour avancer. V1 garde ces justifications et intègre les décisions de réalisation : Sites remplace la proposition Vercel, PWA distincte, droits et statuts précisés, Brevo serveur avec Cron Supabase, session d’onglet conservée et identité visuelle gâteau. Les copies du sujet et de la note initiale dans les fichiers sources du projet restent inchangées.

