# Préparation du dépôt Zoho — aucune réponse soumise

Formulaire lu le 14 novembre 2026 : https://survey.zohopublic.com/zs/W8Bn8w

Il indique une remise avant **lundi 16 novembre à 18 h** et un live le **mardi 17 novembre à 12 h 30**. Le texte demande explicitement des liens accessibles en lecture (projet, note de cadrage, vidéo). Le fuseau n’est pas explicité dans le formulaire ; ces heures sont reproduites telles qu’affichées.

Lecture seule du HTML public : champs et textes identifiés ; aucun formulaire rempli ou soumis, aucun consentement choisi. L’interface dynamique n’a pas été testée dans un navigateur par l’agent.

## Informations à compléter personnellement

- Prénom et nom.
- E-mail d’inscription au compte élève.
- Abonnement IA réellement utilisé.
- Impact réel des limites d’utilisation.
- Temps réellement consacré au cas.
- Accord pour présentation au live enregistré : non anonyme, anonyme ou refus. Ne pas choisir au nom de l’utilisateur.

## Champs du travail — réponses préparées

### Quel niveau de réalisation as-tu choisi ?

Niveau 3 : landing page, application et e-mails.

### As-tu terminé ce niveau ?

Les choix du formulaire sont « Oui, il est terminé et vérifié », « En partie » et « Non, je dépose mon travail en cours ».

À choisir par l’utilisateur au moment du dépôt selon l’état final. Le parcours de niveau 3 a été réalisé et vérifié avec confirmation réelle et rappel simulé explicite, ce qu’autorise le brief. La démonstration est préparée mais non encore présentée/enregistrée ; dernier rendu du fond et accès des destinataires restent à finaliser. Ne pas assimiler automatiquement une simulation clairement signalée à un niveau incomplet, ni annoncer une vidéo existante.

### Lien vers ton code ou ton projet

https://github.com/Leeloog4/le-four-du-canal

Dépôt rendu public par l’utilisateur, vérifié via GitHub et une requête API anonyme HTTP 200. Ce lien est accessible en lecture sans invitation. Le site et la PWA restent privés.

### URL de démonstration

Landing : https://four-du-canal-exercice.leeloog4.chatgpt.site/
PWA : https://four-du-canal-exercice.leeloog4.chatgpt.site/app/

Les deux URL sont privées au compte propriétaire Sites. Fournir le lien sans organiser l’accès ne suffit pas pour l’évaluation. Une vidéo accessible permet de montrer le parcours, mais ne rend pas ces URL publiques. L’accès Sites et la connexion métier de la PWA restent distincts ; ne jamais donner les identifiants du propriétaire.

### Ta note de cadrage

Option document : https://app.notion.com/p/417ec4a3bfbd81d7b738c6cf9f62c85f

Alternative publique déjà accessible : https://github.com/Leeloog4/le-four-du-canal/blob/main/docs/note-cadrage-actualisee.md . Le lien Notion nécessite ses propres droits. Le formulaire permet aussi de coller la note directement, dans une limite affichée de 20 000 caractères. La copie intégrale actualisée peut dépasser cette limite ; version courte prête à coller ci-dessous.

```text
Projet : Le Four du Canal — concours amateur de pâtisserie. Niveau retenu : 3 (landing page, application et e-mails).

Besoin compris : présenter le concours et recueillir les inscriptions, permettre à l’équipe de gérer les participants, au jury de noter, obtenir un classement cohérent et communiquer par confirmation/rappel.

Questions de cadrage : quelles données d’inscription, capacité, date/lieu, barème, nombre de jurés, droits, règles de doublons et égalités, accès WordPress, expéditeur et déclencheurs e-mail ? Aucune réponse client supplémentaire n’est fournie par ce cas. Les choix suivants sont donc des hypothèses d’exercice et non des réponses inventées du client.

Hypothèses : prénom, nom, e-mail ; pas de capacité maximale ; e-mail normalisé unique avec refus du doublon ; un compte organisateur et un compte jury. Concours fictif le 4 décembre 2026 à 15 h Paris, Atelier du Canal, 12 rue des Gourmands, 75010 Paris (lieu fictif). Trois critères FICTIFS goût/texture/présentation, entiers sur 10, somme sur 30. Classement interne des actifs entièrement évalués, ex aequo conservés avec rangs 1/1/3.

Répartition : landing de présentation et inscription ; application privée en PWA pour participants, notes, classement et suivi e-mail. Jury : actifs seulement, sans adresses, écriture des notes. Organisateur : actifs/retirés, coordonnées, retrait/réactivation, notes en lecture seule et historique e-mail. Les notes sont conservées après retrait, mais la participation sort du classement. Pas de suppression ni gestion multi-jurés.

WordPress : page séparée, liée depuis un bouton ou une entrée de menu du site existant ; lien de retour prévu lorsque l’URL réelle sera connue. Aucune modification WordPress effectuée. Pas de duplication des inscriptions dans WordPress.

Stack : Sites pour le frontend, Supabase PostgreSQL/Auth/fonctions/Cron/Vault, Brevo côté serveur. Pas de Make. Confirmation après l’enregistrement ; rappel J-1 le 3 décembre à 15 h Paris aux inscrits encore actifs. Aucun rappel rétroactif ou après l’événement. Retrait annulant les messages encore en attente, réactivation sans recréation. Aucun renvoi automatique d’un résultat incertain.

Réalité des e-mails : confirmation et message de test reçus sur une adresse contrôlée selon la recette utilisateur. Rappel fictif dû traité une fois par Cron en simulation (simulated, attempts=1, aucun identifiant Brevo), sans livraison réelle de rappel revendiquée. Contenus/destinataires/échéances/états visibles dans l’historique organisateur. Accepté par Brevo ne signifie pas livré.

Sécurité : comptes et rôles vérifiés par les fonctions serveur, secrets privés hors navigateur. Session temporaire de l’onglet conservée après actualisation, une heure maximum ; sessionStorage accessible au JavaScript de l’origine, pas de cookie HttpOnly. Déconnexion vérifiée. Aucun audit de production revendiqué ; CORS ne suffit pas contre les robots, protection anti-abus distribuée non ajoutée. Données et API exclues du cache PWA, Internet nécessaire. L’accès propriétaire privé Sites est distinct des rôles métier et doit être organisé pour l’évaluation.

Vérifications : inscription/doublon/champs vides, droits organisateur/jury, notes et classement/ex aequo, retrait/réactivation, notation mobile, persistance puis suppression de session, rappel simulé sans répétition. Dernière suite automatisée : 139 tests réussis, réseau substitué sans envoi réel.

Limites : informations réelles, barème, capacité, conservation des données et coûts à confirmer avant usage réel. Démonstration encore à présenter ou enregistrer ; rendu final du fond gâteau à vérifier. Les liens de code et démo sont privés tant qu’un partage explicite n’a pas été organisé.
```

### Ton README

Le README est déjà dans le dépôt ; le formulaire dit de laisser ce champ vide dans ce cas, à condition que le projet soit accessible. Lien : https://github.com/Leeloog4/le-four-du-canal/blob/main/README.md

### Tes vérifications

```text
1. Inscription et erreurs : une inscription a été enregistrée puis retrouvée dans Supabase/PWA. Une seconde soumission de la même adresse est refusée. Sur téléphone, les champs vides bloquent l’envoi et sont signalés obligatoires. Une confirmation a été reçue sur une adresse contrôlée. Résultats confirmés pendant la recette utilisateur.

2. Rôles et notation : jury sans adresses e-mail ni participants retirés, saisie 8/9/7 et relecture donnant 24/30. Deux participants de total 24 sont ex aequo. Retrait/réactivation côté organisateur conservant les notes ; retiré toujours visible à l’organisateur et masqué au jury. Saisie sur téléphone et déconnexion après actualisation confirmées.

3. Rappel planifié : tâche fictive arrivée à échéance, traitée par Cron. Capture SQL : state=simulated, attempts=1, message_id=NULL et processed_at renseigné. Seconde lecture après attente : toujours une tentative. Aucun e-mail réel envoyé pour cette adresse .test ; aucune réception de rappel réel revendiquée.

Complément : 139 tests automatisés réussis et vérification syntaxique. Les tests remplacent le réseau et n’envoient pas de vrais e-mails ; ils complètent les vérifications manuelles.
```

### Lien vers la démonstration de ton parcours principal

À compléter avec le lien de la vidéo ou de l’enregistrement d’écran accessible en lecture. Aucune vidéo créée à ce stade ; le guide écrit docs/demo.md n’est pas un enregistrement.

### Quels outils d’IA as-tu utilisés ?

ChatGPT et Codex sont attestés par cette conversation. Cocher uniquement les autres outils effectivement utilisés par l’utilisateur ; ne pas les déduire des services techniques Supabase/Brevo.

### Ta question pour Milan — proposition facultative

```text
J’ai construit le niveau 3 avec une landing séparée de WordPress, une PWA jury/organisateur et des fonctions Supabase appelant Brevo sans Make. La confirmation réelle est vérifiée ; le rappel a été testé en simulation sans répétition. Quels seraient les deux changements prioritaires avant une utilisation avec de vrais participants, notamment pour sécuriser le formulaire public et la session ?
```

## Avant de cliquer sur Soumettre

Vérifier les accès en lecture, compléter les réponses personnelles et le choix de consentement, fournir la démonstration réalisée et relire l’état déclaré. Ne pas coller de secret ou de mot de passe. L’envoi final du formulaire n’a pas été effectué par l’agent.
