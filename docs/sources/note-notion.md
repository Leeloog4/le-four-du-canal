Here is the result of "fetch" for the Page with URL https://app.notion.com/p/417ec4a3bfbd81d7b738c6cf9f62c85f as of 2026-11-13T21:24:47.734Z:
<page url="https://app.notion.com/p/417ec4a3bfbd81d7b738c6cf9f62c85f">
<ancestor-path></ancestor-path>
<properties>
{"title":"Note de cadrage — Niveau 3"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## 1. Référence

- <b>Projet :</b> Concours amateur de pâtisserie — Le Four du Canal
- <b>Type :</b> Landing page, application de gestion du concours et e-mails
- <b>Version :</b> V0 — cadrage initial à partir du brief étudiant
- <b>Statut :</b> À valider ; plusieurs règles métier ne sont pas précisées dans le sujet

## 2. Contexte

Le Four du Canal est une pâtisserie indépendante qui organise un concours amateur de pâtisserie dans trois semaines. Son site existe sous WordPress. Le client ne sait pas s’il faut ajouter une page dédiée au site ou créer une page séparée.

Le brief mentionne trois besoins : présenter le concours et recueillir les inscriptions, suivre les participants et leurs notes, puis envoyer des e-mails liés à l’événement.

## 3. Besoin / enjeux

<b>Besoin exprimé :</b> disposer d’une solution numérique pour présenter le concours, inscrire les participants, aider l’équipe à gérer les candidatures et les notes du jury, afficher un classement et communiquer par e-mail.

<b>Enjeux :</b>

- Rendre le parcours d’inscription simple et compréhensible.
- Centraliser les informations utiles à l’organisation.
- Appliquer des règles de notation et de classement cohérentes.
- Éviter les erreurs de saisie et les communications manuelles oubliées.
- Livrer une solution démontrable avant l’événement.

<b>Objectif de réussite proposé :</b> un participant peut s’inscrire et voit une confirmation ; une personne autorisée peut consulter les inscriptions, saisir les notes selon les critères retenus et obtenir le classement calculé selon les règles validées ; les deux e-mails prévus sont testés ou leur simulation est clairement identifiée.

## 4. Compréhension du besoin

Le périmètre retenu pour l’exercice est le <b>niveau 3</b> du brief : landing page, petite application et e-mails.

<b>Parcours cible envisagé :</b>

1. Le participant consulte la page et remplit le formulaire.
2. Le système vérifie les champs obligatoires et enregistre l’inscription.
3. Le participant reçoit une confirmation, ou un retour de test/simulation clairement indiqué.
4. L’équipe autorisée consulte les participants dans l’application.
5. Le jury saisit les notes selon les critères définis.
6. L’application calcule et affiche le classement.
7. Un rappel est envoyé avant l’événement.

<b>Réponses du client :</b> aucune réponse n’est fournie dans le cas pratique. Pour pouvoir réaliser le prototype, les hypothèses provisoires suivantes sont retenues : inscription avec prénom, nom et e-mail ; pas de limite d’inscription ; trois critères de démonstration notés sur 10, score final par somme ; ex æquo en cas de score identique ; classement réservé à l’équipe ; un rôle organisateur et un rôle jury ; confirmation après inscription et rappel programmé 24 h avant l’événement. Ces hypothèses ne sont pas des réponses du client et devront être remplacées si le besoin réel diffère.

## 5. Nombre d’utilisateurs

Le nombre n’est pas indiqué dans le brief.

- <b>Externes :</b> participants ; nombre maximal à confirmer.
- <b>Internes :</b> organisateur(s) et membre(s) du jury ; nombre à confirmer.
- <b>Hypothèse de prototype :</b> un compte organisateur et un compte jury pour démontrer les deux rôles, avec des données fictives. Le nombre réel de participants et d’utilisateurs internes reste inconnu.

## 6. Profils utilisateurs

- <b>Participant :</b> consulte les informations du concours et soumet une inscription.
- <b>Organisateur :</b> consulte et gère les participants ; supervise l’application.
- <b>Membre du jury :</b> consulte les informations nécessaires et saisit les notes.
- <b>Administrateur du prototype :</b> configure les outils et les accès pour la démonstration.

<b>À confirmer :</b> les rôles peuvent être regroupés ou séparés selon l’organisation réelle.

## 7. Droits d’accès

Légende : <b>L</b> = lecture, <b>C</b> = création, <b>M</b> = modification, <b>S</b> = suppression.

| Données / fonctions | Participant | Organisateur | Jury |
| --- | --- | --- | --- |
| Informations publiques du concours | L | L | L |
| Création d’une inscription | C | — | — |
| Liste des participants | — | L, M | L |
| Notes du jury | — | L | C, M |
| Classement interne | — | L | L |
| Comptes et paramètres | — | M | — |

<b>Hypothèse de prototype :</b> les comptes organisateur et jury sont authentifiés ; le classement reste interne ; la suppression des inscriptions n’est pas proposée dans l’interface. Le participant ne peut pas consulter les données des autres. Les droits devront être testés.

## 8. Contraintes opérationnelles

<b>Confirmé par le brief :</b>

- Le concours a lieu dans trois semaines.
- Le site WordPress existe.
- Les détails du concours et les outils utilisés ne sont pas tous précisés.
- Le niveau 3 est visé pour l’exercice.

<b>Inconnues du sujet :</b> date et lieu exacts, capacité, identité visuelle, accès au WordPress, adresse d’envoi, noms des critères et règles réelles de notation. Pour le prototype, la capacité n’est pas limitée ; une date fictive pourra servir à la démonstration du rappel ; la page sera hébergée séparément et reliée à WordPress par un lien.

La proximité de l’événement impose de prioriser un parcours complet et vérifiable. Les détails graphiques ou fonctions supplémentaires ne doivent pas retarder l’inscription, la saisie des notes, le calcul du classement ou les e-mails.

## 9. Gestion des données

<b>Données du prototype :</b>

- Participant : prénom, nom, e-mail, statut d’inscription et date de création.
- Notation : trois critères fictifs, note de 0 à 10 pour chaque critère, total calculé par somme.
- Comptes internes : e-mail et rôle (organisateur ou jury).
- E-mails : destinataire, type de message, état (programmé, envoyé, échec) et identifiant de message si disponible.
- Concours : date et heure fictives de démonstration, à remplacer par la date réelle.

Les coordonnées des participants et les comptes de l’équipe sont des données personnelles. Le prototype minimise les champs en ne demandant que prénom, nom et e-mail. L’âge, les coordonnées d’un responsable légal ou toute donnée sensible ne sont pas collectés.

<b>À définir avant une mise en production :</b> responsable du traitement, information des participants, base légale, durée de conservation, modalités de suppression ou d’export et conditions d’accès. Le prototype utilisera de préférence des données fictives pour la démonstration.

## 10. Périmètre

- Landing page responsive présentant les informations confirmées du concours.
- Formulaire d’inscription avec validation des champs et retour après soumission.
- Stockage des inscriptions.
- Accès interne à l’application pour les utilisateurs autorisés.
- Consultation et gestion de la liste des participants.
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
| Présenter le concours | Informer les participants | Contenus, date, lieu, modalités | Contenu exact à fournir |
| Inscrire un participant | Permettre une inscription simple | Prénom, nom, e-mail obligatoires ; aucune limite de capacité dans le prototype | Pas de liste d’attente |
| Confirmer l’inscription | Informer de l’enregistrement | Après enregistrement ; destinataire = e-mail fourni | Envoi réel, test ou simulation à préciser |
| Gérer les participants | Consulter les inscriptions | Liste et statut | Rôles d’accès à confirmer |
| Saisir les notes | Permettre l’évaluation par le jury | Trois critères fictifs, chacun noté de 0 à 10 ; compte jury authentifié | Règle provisoire de démonstration, à remplacer par le barème réel |
| Calculer le classement | Ordonner les résultats | Somme des trois notes ; scores égaux affichés ex æquo | Classement interne uniquement dans le prototype |
| Envoyer un rappel | Rappeler l’événement aux inscrits | Rappel programmé 24 h avant l’événement à l’adresse du participant | Date fictive de démo ; l’envoi et son statut devront être vérifiés |

## 13. Stack

<b>Proposition pour le prototype :</b>

- Codex : assistance à la conception et à la construction par fonctionnalités.
- GitHub : dépôt et historique du projet.
- Vercel : hébergement et déploiements de démonstration.
- Supabase : base de données et authentification de l’espace organisateur.
- Brevo : e-mails transactionnels.

Cette stack est une recommandation, pas une exigence du sujet. Make n’est pas nécessaire : les e-mails transactionnels sont appelés côté serveur via Brevo ; la confirmation part après l’inscription et le rappel est programmé 24 h avant l’événement. Les clés d’API ne doivent pas être exposées dans le navigateur. Les règles d’accès aux données doivent être configurées et vérifiées. Pour la démonstration, tout envoi non exécuté réellement sera marqué comme test ou simulation.

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

- <b>Mode de travail :</b> cadrage, validation du plan, construction par petites fonctionnalités et vérification à chaque étape.
- <b>Responsable produit / réalisation :</b> à identifier dans l’exercice.
- <b>Validation métier :</b> client, organisateur et jury selon les sujets.
- <b>Données de démonstration :</b> fictives tant que les données réelles ne sont pas nécessaires et autorisées.
- <b>Mise en production :</b> non définie dans le brief ; le prototype ne sera pas présenté comme une solution de production sans validation.

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

- <b>Coûts initiaux :</b> conception et réalisation.
- <b>Coûts récurrents :</b> hébergement, base de données, nom de domaine ou abonnements éventuels.
- <b>Coûts variables :</b> volume d’e-mails ou dépassements de quotas.

Pour l’exercice, les coûts d’outils seront consignés séparément du temps de réalisation. Aucun montant n’est inventé dans cette V0.

## 18. Planning / jalons

Le concours est annoncé dans trois semaines, mais le brief ne précise ni sa date exacte ni le temps disponible pour le prototype. Planning indicatif :

1. Consigner les inconnues et valider les hypothèses de démonstration — cadrage.
2. Préparer le projet, le modèle de données et les accès — avant l’interface.
3. Construire la landing page et le formulaire — premier parcours complet.
4. Construire l’espace interne, les notes fictives et le classement — selon les hypothèses retenues.
5. Brancher ou simuler la confirmation et le rappel — avec le statut correctement indiqué.
6. Vérifier le parcours, corriger et préparer README et démonstration.

La date de mise en ligne réelle n’est pas confirmée.

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

## Points à trancher avant la construction

Les hypothèses de démonstration retenues sont : prénom/nom/e-mail, aucune limite d’inscription, trois critères fictifs notés sur 10, total par somme, ex æquo en cas d’égalité, classement interne, un compte organisateur et un compte jury, confirmation après inscription, rappel 24 h avant l’événement, page séparée reliée à WordPress par un lien. Ces choix guident le modèle de données, l’interface et les tests ; ils ne valent pas validation par le client. Avant un usage réel, il faudra remplacer les valeurs fictives par les règles et contenus confirmés.

<b>Conformité :</b> cette note suit les 21 rubriques du template de cadrage indiqué dans les consignes du projet. Elle distingue les éléments du sujet, les recommandations et les informations absentes. Les hypothèses restent à valider avant d’être traitées comme des règles définitives.
</content>
</page>
