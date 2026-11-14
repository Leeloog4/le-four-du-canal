Here is the result of "fetch" for the Page with URL https://app.notion.com/p/417ec4a3bfbd81c3b856f10110875bdf as of 2026-11-13T21:13:23.194Z:
<page url="https://app.notion.com/p/417ec4a3bfbd81c3b856f10110875bdf">
<ancestor-path></ancestor-path>
<properties>
{"title":"Architecture et plan de réalisation — Niveau 3"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## Objectif

Définir une architecture minimale pour réaliser le niveau 3 du cas : landing page avec inscriptions, application organisateur avec notes et classement, e-mail de confirmation et rappel avant l’événement. Cette proposition est un plan de prototype ; les informations absentes du brief restent à confirmer.

## 1. Parcours cible

### Participant

1. Arrive sur la landing page, depuis son URL ou un lien placé sur le site WordPress.
2. Consulte les informations du concours.
3. Soumet le formulaire d’inscription.
4. Le serveur valide les champs et enregistre l’inscription dans Supabase.
5. Après enregistrement réussi, le serveur demande à Brevo d’envoyer l’e-mail de confirmation.
6. Si la date de l’événement est connue, le serveur programme aussi le rappel à l’avance.

### Organisateur et jury

1. Se connectent à l’espace privé.
2. Consultent les participants.
3. Le jury saisit une note par critère et participant.
4. L’application calcule le résultat selon la formule validée et affiche le classement.
5. L’organisateur peut consulter l’état des e-mails ; toute erreur d’envoi doit être visible.

## 2. Architecture proposée

| Composant | Rôle | Données / limites |
| --- | --- | --- |
| Frontend web responsive | Landing page publique et espace de gestion | Aucune clé secrète ne doit être embarquée dans le navigateur |
| Fonctions serveur Vercel | Valider les inscriptions, appeler Supabase et Brevo, programmer le rappel | Conserver les clés privées dans les variables d’environnement |
| Supabase Auth | Authentifier l’équipe organisatrice et les jurés | Les rôles exacts restent à confirmer |
| Supabase Database | Stocker participants, critères, notes et états d’e-mails | Activer des règles d’accès adaptées (RLS) |
| Brevo Transactional API | Envoyer la confirmation et programmer le rappel | La date programmée doit être fournie en UTC ; état réel à contrôler dans Brevo |
| GitHub | Historique du code et suivi des modifications | Dépôt à créer pour le projet |

Le rappel est programmé par l’application via l’API Brevo au moment de l’inscription. <b>Make n’est pas requis.</b> La date de rappel proposée par défaut est 24 h avant l’événement, mais elle doit être confirmée. Si un participant s’inscrit après l’heure prévue du rappel, l’application ne doit pas programmer un message dans le passé ; ce cas sera indiqué et traité selon la règle retenue.

## 3. Modèle de données initial

Les noms sont provisoires et devront rester identiques dans le code et la base.

- <b>Participant</b> : id, prénom, nom, e-mail, statut d’inscription, date de création, état de confirmation, état du rappel, identifiant du message programmé.
- <b>Critère</b> : id, libellé, note maximale, pondération éventuelle, ordre d’affichage.
- <b>Note</b> : id, participant, critère, jury, valeur, date de saisie. Une contrainte d’unicité participant + critère + jury évitera les doublons.
- <b>Compte équipe</b> : id Supabase Auth, e-mail, rôle.
- <b>Paramètres du concours</b> : date/heure, fuseau, lieu, capacité, date/heure du rappel et paramètres d’affichage du classement.

Ce modèle devra être simplifié si le brief confirmé prévoit un seul jury ou une seule édition du concours. La méthode d’agrégation des notes, les pondérations et le départage restent non définis tant que le client ne les a pas fournis.

## 4. Règles de sécurité du prototype

- L’inscription publique ne donne accès qu’à la création d’une inscription ; un participant ne peut pas consulter les autres.
- L’espace de gestion exige une authentification.
- Les droits d’écriture sur les notes sont limités aux comptes jury ou organisateur autorisés.
- Les règles de sécurité doivent être configurées côté base/serveur et vérifiées avec des comptes de test.
- Les clés Supabase privilégiées et la clé API Brevo restent côté serveur.
- Utiliser des données fictives pour les captures et la démonstration.
- Ne pas afficher publiquement le classement avant confirmation explicite de cette règle.

## 5. Choix liés à WordPress

Pour le prototype, la page sera hébergée séparément et pourra être reliée depuis WordPress par un bouton ou un lien. L’intégration directe dans WordPress n’est pas retenue tant que l’accès au site, au thème et au gestionnaire n’est pas confirmé.

## 6. Découpage de réalisation

1. <b>Préparer le dépôt et le brief technique</b> : règles, hypothèses, variables nécessaires, parcours.
2. <b>Créer le modèle et les accès</b> : tables, authentification, règles d’accès et données fictives.
3. <b>Construire la landing page et l’inscription</b> : responsive, validation, confirmation visuelle.
4. <b>Construire l’espace équipe</b> : connexion, liste des participants, formulaires de notes, classement.
5. <b>Brancher les e-mails</b> : confirmation immédiate après enregistrement ; rappel programmé avant l’événement ; état d’envoi visible.
6. <b>Vérifier et documenter</b> : parcours nominal, champs invalides, accès non autorisé, calcul du classement, envoi ou simulation des deux e-mails ; README et démonstration.

Chaque fonctionnalité sera construite et vérifiée avant de passer à la suivante. Les fonctions non vérifiées seront décrites comme telles.

## 7. Critères d’acceptation du prototype

- La landing page est lisible sur ordinateur et mobile.
- Le formulaire refuse les champs obligatoires manquants ou invalides et affiche un retour clair.
- Une inscription valide est retrouvable dans l’espace organisateur.
- Un compte non autorisé ne peut pas consulter ni modifier les données internes.
- Le jury peut saisir les notes selon les critères validés.
- Le classement correspond à la règle de calcul validée et aux données saisies.
- L’e-mail de confirmation est envoyé, testé ou simulé avec ce statut indiqué sans ambiguïté.
- Le rappel est programmé ou simulé avec un déclencheur, une date et un destinataire explicites.
- Le README distingue ce qui fonctionne, ce qui est simulé et ce qui n’a pas été vérifié.

## 8. Décisions à confirmer

1. Date, heure, fuseau et lieu exacts.
2. Capacité, champs et éventuelle liste d’attente.
3. Critères, barème, pondérations, nombre de jurés et règle de départage.
4. Classement interne ou public.
5. Date et heure du rappel, destinataires, expéditeur et contenu des deux e-mails.
6. Nombre et rôle des organisateurs/jurés.
7. Accès WordPress et modalités de mise en ligne.
8. Outils, comptes et contraintes de budget réellement disponibles.

## Références techniques officielles

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel — variables d’environnement](https://vercel.com/docs/environment-variables)
- [Brevo — e-mail transactionnel programmé](https://developers.brevo.com/reference/send-transac-email)
</content>
</page>
