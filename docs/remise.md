# Fiche de remise — Le Four du Canal

État au 14 novembre 2026. Niveau 3 : landing page, application privée et e-mails. La note réunit le besoin compris, les questions posées, les réponses du client et les décisions retenues ; date, lieu et barème de démonstration restent explicitement fictifs.

## Livrables et accès

| Attendu | Élément fourni | État |
| --- | --- | --- |
| Code ou projet | [Dépôt GitHub](https://github.com/Leeloog4/le-four-du-canal) | Sources et historique présents ; dépôt public, accès anonyme vérifié |
| URL de démonstration | [Landing](https://four-du-canal-exercice.leeloog4.chatgpt.site/) et [PWA](https://four-du-canal-exercice.leeloog4.chatgpt.site/app/) | Publiées, accès public ; données PWA sous connexion métier |
| Court README | [README](../README.md) | Instructions et état réel ; prototype local explicitement distinct |
| Note de cadrage | [Note Notion](https://app.notion.com/p/417ec4a3bfbd81d7b738c6cf9f62c85f), [copie actualisée](note-cadrage-actualisee.md) | Besoin, questions, absence de réponses client, hypothèses, niveau et décisions |
| Deux ou trois vérifications et résultats | Trois scénarios ci-dessous ; [recette détaillée](recette.md) | Effectuées, avec limites de preuve indiquées |
| Courte démonstration | [Scénario de cinq minutes](demo.md) | Préparé ; présentation en direct ou enregistrement encore à réaliser |

Le code et les documents Markdown du dépôt sont publics ; la landing est publique, les données PWA restent authentifiées et la note Notion conserve ses propres droits. Prévoir une démonstration depuis le compte propriétaire ou un enregistrement, et utiliser la copie publique du cadrage si l’accès Notion n’est pas partagé. GitHub a été rendu public par l’utilisateur puis vérifié ; l’accès Sites n’a pas été modifié ; ne pas communiquer les identifiants du propriétaire.

## Articulation avec le WordPress existant

Choix retenu : garder WordPress comme site principal et héberger la page de concours séparément, pour avancer sans accès administrateur WordPress et sans modifier son thème ou ses extensions.

Sur WordPress, le gestionnaire pourrait ajouter un bloc d’annonce ou un bouton « Concours de pâtisserie — Je participe » sur la page d’accueil, et éventuellement un élément « Le concours » dans le menu. Ces liens pointeraient vers l’URL de la landing. La personne consulte alors le concours, s’inscrit et obtient son retour dans la page séparée. Les données sont enregistrées une seule fois dans Supabase ; WordPress n’a pas à conserver une deuxième liste.

Prévoir sur la landing un lien de retour vers le vrai site WordPress lorsque son URL sera fournie, ainsi qu’une identité visuelle harmonisée. Aucune URL WordPress réelle n’est connue ; aucun faux lien n’a été ajouté. La PWA interne n’est pas exposée dans le menu public et exige ses propres comptes métier.

Pour la démonstration actuelle, Sites impose aussi un accès propriétaire. Avant d’utiliser cette articulation avec de vrais participants, décider explicitement de l’hébergement et de l’accès public de la landing, puis adapter l’origine autorisée des fonctions si le domaine change. L’intégration WordPress est donc expliquée, pas déclarée réalisée.

## Accès et limites de sécurité du prototype

| Profil | Accès et actions |
| --- | --- |
| Participant | Page du concours et inscription sans compte participant ; aucune liste, note ou classement interne |
| Jury authentifié | Participants actifs uniquement, sans adresses e-mail ; saisie/modification des notes ; classement interne |
| Organisateur authentifié | Actifs et retirés avec coordonnées ; retrait/réactivation ; notes en lecture seule ; classement ; historique des confirmations/rappels |
| Administration technique | Comptes et paramètres dans Supabase, GitHub et Sites ; pas de console d’administration complète dans la PWA |

Les fonctions serveur vérifient le jeton auprès de Supabase Auth puis le rôle dans team_users : cacher un bouton n’est pas la seule protection. La notation d’un retiré est refusée côté serveur. Les tables métier sont protégées par RLS et des privilèges limitant les accès directs ; la matrice RLS externe n’a pas été inspectée directement par l’agent. Le secret Cron est distinct des comptes et reste dans Supabase Secrets/Vault. Les clés privées Brevo et Supabase ne sont pas dans le navigateur ; la clé Supabase publiable n’est pas une clé privilégiée.

Limites explicites :

- Session d’une heure maximum conservée dans sessionStorage de l’onglet, accessible au JavaScript de l’origine ; ce n’est pas un cookie HttpOnly. Droits revérifiés à l’actualisation, stockage effacé à la déconnexion/expiration. Aucun mot de passe ni refresh token stocké.
- Aucun audit de sécurité de production revendiqué. Le formulaire possède une validation serveur, une limite de taille, un champ piège et une origine CORS limitée, mais pas de protection distribuée contre les abus. CORS ne bloque pas un robot appelant directement une API.
- Démonstration Sites privée : cette barrière est distincte de l’authentification métier et ne doit pas être considérée comme la protection suffisante d’un futur formulaire public.
- Un seul compte jury de démonstration ; aucun modèle multi-jurés, gestion complète des comptes ou MFA imposé par la PWA.
- Internet requis. Le service worker cache la coquille statique, jamais les participants, notes, jetons ou API ; pas de saisie hors ligne.
- Information relative aux données, responsable de traitement et durée de conservation restent à définir avant usage réel. Pas de garantie de production.

## E-mails : contenu, déclencheur, destinataire et réalité des envois

| Message | Déclencheur | Destinataire | État vérifié |
| --- | --- | --- | --- |
| Confirmation | Après l’enregistrement atomique de l’inscription et de ses deux tâches | Adresse fournie à l’inscription | Réception réelle confirmée sur une adresse contrôlée. Adresses réservées comme .test : simulation sans envoi |
| Rappel | Échéance J−1 : 3 décembre 2026 à 15 h Paris ; Cron appelle traiter-rappels chaque minute pour les tâches dues | Adresse de l’inscription encore active | Traitement d’un rappel fictif dû vérifié en simulation. Aucun rappel réel reçu revendiqué |
| Test indépendant | Clic volontaire de l’organisateur sur « Envoyer l’e-mail de test » | Adresse fixe configurée dans BREVO_TEST_RECIPIENT côté serveur | Vrai message de test reçu selon l’utilisateur ; hors historique email_jobs |

Les contenus ci-dessous sont ceux des fonctions versionnées, avec leurs variables de personnalisation rendues lisibles. La date et le lieu restent explicitement fictifs. Le contenu réellement enregistré se consulte dans PWA → E-mails → Voir le message.

### Confirmation

Objet : `[DÉMONSTRATION] Votre inscription au Four du Canal`

```text
Bonjour {prénom},

Votre participation au concours amateur de pâtisserie est enregistrée.
Date fictive de l’exercice : {date et heure du concours formatées en français} (Paris).
{lieu fictif}.

Ce message appartient à un prototype de démonstration.
Le Four du Canal
```

### Rappel

Objet : `[DÉMONSTRATION] Rappel du concours du Four du Canal`

```text
Bonjour {prénom},

Le concours de pâtisserie approche.
Date fictive de l’exercice : {date et heure du concours formatées en français} (Paris).
{lieu fictif}.

Ce message appartient à un prototype de démonstration.
Le Four du Canal
```

Variables : concours le 4 décembre 2026 à 15 h, Europe/Paris ; lieu « Atelier du Canal, 12 rue des Gourmands, 75010 Paris (lieu fictif) ». L’adresse destinataire vient de l’inscription, pas d’un champ libre dans l’interface de suivi.

### Message de test indépendant

Objet : `[TEST] Le Four du Canal — vérification e-mail`

```text
Bonjour,

Ceci est un message de test du projet Le Four du Canal.
Il permet de vérifier la réception des e-mails avant leur activation pour le concours.
Ce message ne constitue pas une inscription.

Le Four du Canal
```

La phrase « avant leur activation » est le texte du test initial conservé dans la fonction ; elle ne décrit pas l’état actuel des confirmations, désormais actives.

### Règles d’interprétation

« Accepté par Brevo » atteste une demande acceptée avec identifiant fournisseur, pas la livraison en boîte de réception. Celle-ci a été confirmée par l’utilisateur pour le test et une confirmation. Pas de webhook de livraison dans cette V1. Les échecs et résultats incertains restent visibles, sans renvoi automatique. Une panne e-mail n’annule pas l’inscription. Le retrait annule les tâches encore en attente ; la réactivation ne les recrée pas. Inscription après J−1 : pas de rappel rétroactif ; aucun rappel après l’événement.

## Trois vérifications manuelles effectuées

| Scénario | Manipulations effectuées et résultat | Preuve et limites |
| --- | --- | --- |
| 1. Inscription et erreurs essentielles | Inscription créée puis retrouvée ; deuxième soumission avec la même adresse refusée. Sur téléphone, champs vides bloqués et indiqués obligatoires. Confirmation reçue sur une adresse contrôlée | Observations confirmées par l’utilisateur ; pas de comptage indépendant des appels fournisseur par l’agent |
| 2. Parcours interne et droits | Jury sans adresses ni retirés ; notes 8/9/7 enregistrées et relues, 24/30 au classement ; égalité avec un second total 24. Retrait/réactivation conservant les notes côté organisateur ; notation sur téléphone confirmée | Recette utilisateur ; tests automatisés supplémentaires sur limites de notes et refus de rôles. Aucune prétention d’audit externe complet |
| 3. Rappel planifié de démonstration | Création d’un rappel fictif dû, traitement par Cron ; lecture SQL montrant simulated, attempts=1, identifiant fournisseur vide et date de traitement renseignée. Nouvelle lecture : attempts toujours à 1 | Capture fournie et seconde lecture utilisateur. Traitement simulé, sans livraison réelle du rappel |

Complément confirmé : actualisation conservant la connexion, puis déconnexion et actualisation maintenant le formulaire de connexion. Dernière suite automatisée : 139 tests réussis, réseau substitué sans envoi réel ; elle complète ces observations et ne les remplace pas.

## Hypothèses et questions de cadrage

La [note de cadrage](https://app.notion.com/p/417ec4a3bfbd81d7b738c6cf9f62c85f) présente un échange questions/réponses et les points encore ouverts : budget, règles de conservation et conditions d’utilisation réelle. Choix d’exercice : prénom/nom/e-mail, pas de capacité maximale, e-mail normalisé unique, un organisateur et un jury, trois critères FICTIFS goût/texture/présentation sur 10 et somme sur 30, rangs 1/1/3, classement interne, date et lieu fictifs ci-dessus. Ces règles devront être confrontées au vrai client avant usage réel.

## Derniers éléments avant remise

- Confirmer le rendu final du fond gâteau sur ordinateur et téléphone, puis répéter le guide.
- Présenter la démonstration en direct ou enregistrer le scénario ; le fichier vidéo n’existe pas encore dans les livrables.
- Organiser l’accès du destinataire au code et aux documents privés, ou remettre un export convenu ; aucun partage automatique par l’agent.

La réception réelle du rappel, l’intégration WordPress et une mise en production ne sont pas revendiquées. Le sujet autorise de montrer un envoi simulé à condition de le signaler clairement : il n’est pas nécessaire d’attendre décembre pour montrer le rappel simulé déjà vérifié.

## Destination du dépôt

Formulaire fourni par l’utilisateur : https://survey.zohopublic.com/zs/W8Bn8w . Il indique une remise avant lundi 16 novembre à 18 h et des liens accessibles en lecture. Voir [la préparation champ par champ](depot-zoho.md) : aucun formulaire soumis, informations personnelles et consentement à compléter par l’utilisateur.

Mise à jour d’accès : Sites rendu public à la demande utilisateur. La barrière propriétaire décrite pendant les phases précédentes ne s’applique plus ; les contrôles Supabase des rôles restent actifs.
