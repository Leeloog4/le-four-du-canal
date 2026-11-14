# Connexion Supabase guidée — étape inscription

Projet fourni par l’utilisateur : https://xeeixhbhfsdxrgeotlix.supabase.co.

État déclaré par l’utilisateur : création du projet puis de la table participants réussie avec le sous-ensemble SQL fourni dans la conversation ; table vide visible. La migration complète 001_initial.sql n’a PAS été appliquée. Ne pas la relancer telle quelle : elle tente de recréer participants. Les autres tables et fonctions restent à créer dans une migration complémentaire après vérification.

Une fonction `inscrire-participant` est préparée dans `supabase/functions/inscrire-participant/index.ts`. L’utilisateur est dans l’éditeur Supabase ; déploiement non confirmé. Elle utilise les variables serveur Supabase natives `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`, sans demander de clé dans le chat. Aucun accès direct aux inscriptions pour le navigateur ; aucune réponse ne révèle les clés ou les lignes de la table.

Cette étape ajoute uniquement l’inscription. Elle ne crée pas de tâche e-mail : `email_state=not_configured`. Aucune confirmation ou rappel n’est annoncé comme envoyé ou programmé. Le formulaire Sites reste simulé jusqu’à sa modification et sa republication explicites.

À faire après déploiement : vérifier le réglage de vérification JWT pour la soumission publique, vérifier les variables natives disponibles et l’URL de la fonction, puis brancher le formulaire et réaliser une inscription fictive suivie d’un doublon. CORS est limité à l’origine exacte du Site ; cela ne remplace pas une protection contre les appels automatisés. Ajouter une protection adaptée avant toute ouverture à de vraies inscriptions.

Le code est vérifié localement avec des requêtes et des réponses de base substituées ; aucune intégration Supabase réelle ni déploiement externe n’est revendiqué à ce stade.

## Mise à jour — formulaire connecté

L’utilisateur a montré la fiche de la fonction déployée, puis confirmé la désactivation de la vérification JWT. Vérifications réelles sans insertion : OPTIONS avec l’origine du Site → HTTP 204 et origine CORS attendue ; POST `{}` → HTTP 422 « Vérifiez le prénom, le nom et l’adresse e-mail ». Cela confirme l’accessibilité et la validation, pas une écriture en base réussie.

Le Site a été republié avec succès en accès privé, sans exposer de clé, vers la fonction `https://xeeixhbhfsdxrgeotlix.supabase.co/functions/v1/inscrire-participant`. Le formulaire n’affiche « enregistrée » qu’après HTTP réussi avec référence ; un échec conserve les champs et un résultat réseau incertain invite à réessayer avec la même adresse. Les mentions d’absence de stockage de l’ancien aperçu ont été remplacées.

5 tests du formulaire avec substitut réseau réussis : succès, erreurs/doublon, coupure réseau, double clic et validation/réponse incomplète. Aucun participant créé par l’agent. Recette à effectuer par l’utilisateur : soumettre une personne fictive, observer la confirmation puis contrôler la ligne dans Supabase.

Publication native : `succeeded`, déploiement `appgdep_6af78f343c988191be2caae1f46fbdb7`, commit `bd96154606546ad8f99f43bcbbbbdf7a8e698613`. Aucun e-mail actif, aucune tâche d’e-mail créée à cette étape.

## Recette manuelle confirmée par l’utilisateur

L’utilisateur a confirmé le message « participation enregistrée », puis la présence de la ligne correspondant à Camille Martin / camille@example.test dans la table participants. Il a ensuite confirmé le message de refus lors d’une nouvelle soumission de la même adresse. Le parcours page → fonction serveur → base est donc confirmé par ses observations dans le navigateur et Supabase. Le nombre de lignes après le doublon n’a pas été revérifié séparément par l’agent. Aucun accès direct à la base ni envoi d’e-mail n’a été réalisé par l’agent.

## Préparation du compte organisateur

L’utilisateur a confirmé la création d’un compte Supabase Auth et fourni son UID : `6c47adac-7fc9-41be-beaa-11b7717dbba6`. Le script `supabase/guided/02-team-users.sql` crée la table de rôles côté serveur et attribue uniquement `organizer` à cet identifiant. Aucune lecture ou modification directe des rôles n’est accordée à anon/authenticated. Exécution et résultat encore à confirmer par l’utilisateur. L’écran de connexion et la liste privée des participants sur le Site ne sont pas encore implémentés ; aucune fonctionnalité d’accès équipe en ligne n’est annoncée comme opérationnelle.

### Confirmation du rôle et préparation de la consultation

## Notation publiée dans la PWA

Recette organisateur confirmée par l’utilisateur : Camille affiche 24/30 et aucun bouton Évaluer/Modifier n’apparaît sur son compte organisateur. La lecture des évaluations sans écriture est validée par sa recette navigateur.

## Classement interne publié

## Préparation du test Brevo

Préparation de la confirmation transactionnelle : `inscrire-participant` a été modifiée localement pour utiliser register_participant et créer les deux tâches, simuler les adresses réservées, réclamer uniquement la confirmation à l’instant de création puis appeler Brevo côté serveur et enregistrer le résultat. La panne e-mail ne remet pas en cause l’inscription. 15 tests locaux de cette fonction avec réseau substitué réussis ; ce nouveau code n’a PAS encore été donné comme déployé par l’utilisateur, aucun envoi déclenché par l’agent.

Affichage des statuts publié de façon compatible avec la fonction précédente (`not_configured`) : accepté par Brevo ne vaut pas livré, pending/failed/uncertain/simulated distingués. 37 tests du Site réussis. Publication native succeeded, commit `ee5af4209c40ab51069f0d9606812c9a67b31371`, déploiement `appgdep_6af81515f338819196c73e30e593dd20`. Cette publication n’active pas la confirmation automatique : remplacement manuel de la fonction Supabase encore nécessaire. Rappel et planificateur non activés.

À la question de l’utilisateur sur GitHub : vérification du remote effectuée, dépôt Git Sites et non GitHub. Les sources Supabase/SQL restent séparées localement. État et consolidation à faire documentés dans `versionnement.md`.

Après la consigne de création d’email_jobs, l’utilisateur indique « ok ». Préparation de `supabase/guided/08-email-workflow.sql` : register_participant crée l’inscription et exactement deux tâches dans une même transaction, avec destinataire issu de l’e-mail du participant ; claim_emails réclame au plus deux tâches dues avec verrou/skip locked, accès serveur uniquement ; set_participant_status est remplacée avec annulation des tâches pending lors d’un retrait. Les versions guidées antérieures sont conservées. Schéma/règles uniquement : aucun message créé ou envoyé par ce script. Exécution de ce nouveau script encore à confirmer.

Réception réelle du premier message [TEST] confirmée par l’utilisateur après les instructions de clic dans la PWA et de vérification de sa boîte. La chaîne PWA → fonction serveur Supabase → Brevo → boîte de réception est confirmée par cette recette utilisateur. L’agent n’a pas reçu les clés et n’a déclenché aucun envoi. Les confirmations/rappels automatiques restent non activés.

Préparation de `supabase/guided/07-email-jobs.sql` : table protégée de suivi et d’attente des confirmations/rappels, unicité participant/type et états distinguant accepted de livraison. Script schéma seul : aucun message créé ou envoyé. Exécution encore à confirmer. Les fonctions transactionnelles, le traitement des messages, le déclenchement après inscription, l’annulation au retrait et le planificateur de rappel seront ajoutés ensuite.

Bouton de test publié dans l’onglet E-mails de la PWA, réservé à l’organisateur. Confirmation avant l’envoi, aucun appel automatique, destinataire uniquement côté serveur. Un résultat accepted ou uncertain bloque les nouveaux clics dans la session ; refus explicite affiché, aucune reprise automatique. Déconnexion efface résultat et données de vue. Le jury ne voit pas cet onglet.

Contrôles réels de envoyer-email-test sans déclenchement fournisseur : OPTIONS 204, POST anonyme 401, jeton invalide 401. Suite du Site : 36 tests réussis avec réseau substitué, dont 4 nouveaux scénarios de test e-mail (clic/confirmation et absence d’envoi automatique, jury/annulation, résultats/refus/incertitude, double clic/déconnexion). Aucune clé reçue ni envoi réel effectué par l’agent.

Publication native succeeded, commit `da85d236b684bb9759c4e280ba6f129dc06c51c7`, déploiement `appgdep_6af7a817550881918e6154968a4b84c9`. Prochaine recette utilisateur : un clic confirmé sur le test puis contrôle de la boîte et des indésirables. Acceptation Brevo et réception réelle restent à confirmer ; confirmation d’inscription et rappel non activés.

L’utilisateur confirme disposer d’un compte Brevo et d’un expéditeur vérifié. Il a suivi la création d’une clé API puis l’ajout dans les Secrets Supabase de BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME et BREVO_TEST_RECIPIENT (adresse contrôlée par lui). Aucune valeur secrète transmise à l’agent et aucune lecture de ces secrets effectuée.

Fonction `envoyer-email-test` préparée, réservée à un compte organizer vérifié via Auth et team_users. Le destinataire provient uniquement du secret serveur ; aucun destinataire fourni dans le corps n’est utilisé. Sujet [TEST], contenu explicite, un seul appel fournisseur et aucune reprise automatique. accepted avec messageId ne vaut pas livraison ; refus et résultats incertains sont distingués. 9 tests locaux avec réseau substitué réussis, aucun envoi réel. Déploiement manuel de la fonction puis bouton de test explicite dans la PWA à réaliser avant une recette de réception. Confirmation et rappel automatiques restent non activés.

Recette utilisateur de gestion validée : l’utilisateur confirme le retrait d’Alex, son statut Retiré et son exclusion du classement ; puis sa réactivation et son retour à 24/30, rang 1 ex æquo avec Camille, sans ressaisie des notes. Conservation des données et notes et recalcul du classement confirmés par ses observations. Aucun e-mail actif à ce stade. Prochaine étape guidée : configurer confirmation et rappel côté serveur avec Brevo, sans Make ; disponibilité du compte Brevo, expéditeur et secrets encore à préciser.

Gestion des participants publiée après confirmation du déploiement de changer-statut-participant par l’utilisateur. Contrôles réels sans écriture : OPTIONS 204, POST sans session 401, jeton invalide 401, origine CORS attendue. PWA : boutons Retirer/Réactiver uniquement pour l’organisateur, confirmation préalable, relecture du statut avant confirmation d’interface, notes conservées, classement recalculé. Aucun bouton de statut pour le jury ; participant retiré non notable.

32 tests frontend du Site réussis avec réponses substituées, dont 6 nouveaux scénarios de gestion (cycle retrait/réactivation, notes/rang, annulation, rôle jury, erreur réseau, relecture non confirmée, double clic et déconnexion). Cache de coquille versionné sans ajout de données privées en cache. Publication native succeeded, commit `069f43469a2a22fb48a51f2fac24e6896ea97c78`, déploiement `appgdep_6af7a309a3008191b80a4bad28897546`. Aucun retrait réel effectué par l’agent ; recette utilisateur suivante : retirer Alex puis vérifier son statut et son exclusion du classement, puis le réactiver.

Gestion des inscrits : fonction `changer-statut-participant` préparée. Elle vérifie le jeton Supabase Auth puis le rôle organizer en base, valide participant_id et les statuts registered/withdrawn, et appelle la RPC set_participant_status. Le jury est refusé même si le corps prétend un rôle différent. 8 tests locaux avec réseau substitué réussis ; aucun statut réel modifié par l’agent. Déploiement de la fonction et bouton dans la PWA encore à faire.

Recette ex æquo confirmée par l’utilisateur : après les consignes d’inscription d’Alex Dupont et de notation 10/6/8, il confirme que Camille et Alex affichent tous deux « 1 ex æquo » à 24/30. Observations utilisateur, sans création de données ni accès à ses comptes par l’agent.

Prochaine étape niveau 2 : gestion des inscriptions par l’organisateur, déjà prévue au cadrage. Préparation de `supabase/guided/06-participant-status.sql`, fonction réservée au serveur pour les statuts registered/withdrawn, sans suppression. Le contrôle du rôle organisateur sera dans la fonction de bord avant appel de cette RPC. Le retrait exclut du classement via la règle existante ; la réactivation conserve les notes. Les tâches e-mail n’existent pas à ce stade : leur annulation sera intégrée à la règle lorsque l’outbox sera créée. Déploiement SQL et interface non encore réalisés.

Recette utilisateur : présence de Camille Martin au rang 1 avec 24/30 dans l’onglet Classement confirmée. Affichage réel de cette première ligne validé par ses observations. Ex æquo vérifiés automatiquement avec données substituées ; recette manuelle avec une seconde participation fictive encore à faire.

L’application possède une vue Classement à côté de Participants, accessible aux deux rôles internes. Calcul dans la PWA à partir des participants et notes obtenus via la fonction authentifiée : actifs uniquement, trois notes complètes, somme sur 30, tri décroissant, égalités conservées avec rangs 1/1/3. Zéro admis, notes manquantes et retirés exclus. Aucune coordonnée dans cette vue, effacement à la déconnexion ; cache de coquille versionné sans cache API ou données.

Aucune migration ou modification Supabase supplémentaire nécessaire. 26 tests du Site réussis, dont 4 nouveaux scénarios de classement : tri/ex æquo, exclusions/zéro, deux rôles/vues/minimisation, recalcul après notation/effacement. Vérification syntaxique et ressources réussie. Tests avec réponses réseau substituées ; rendu et classement réels à confirmer par l’utilisateur.

Publication native `succeeded`, commit `1c85e345c6a27533fa8d56d2a90fd9c0068469d5`, déploiement `appgdep_6af7a07bec6c81918622a07452da547b`. Recette suivante : actualiser la PWA, ouvrir Classement et retrouver Camille au rang 1 avec 24/30. Les e-mails et la gestion des statuts hébergée ne sont pas ajoutés à cette étape.

Recette utilisateur confirmée : saisie de 8/9/7 pour Camille avec le compte jury, message « Évaluation enregistrée : 24 / 30 », puis présence des mêmes valeurs après « Actualiser la liste » et préremplissage correct dans « Modifier les notes ». L’écriture authentifiée et la relecture des notes sont donc validées par les observations utilisateur. Aucun mot de passe ni jeton de son compte n’a été transmis à l’agent. Consultation des notes en lecture seule avec le compte organisateur restant à vérifier manuellement.

L’utilisateur a reçu le code complet mis à jour de `consulter-participants`, puis indiqué « ok » après l’instruction de redéploiement. Le chargement authentifié des notes sera confirmé par la prochaine recette ; l’agent n’a ni mot de passe ni accès direct à la base. Les deux fonctions protégées ont été revérifiées : `consulter-participants` et `noter-participant` renvoient HTTP 401 sans session, avec CORS attendu.

La PWA comporte maintenant une colonne d’évaluation lisible par les deux rôles et un bouton Évaluer/Modifier réservé au jury sur les participants actifs. Dialogue avec trois notes entières 0–10, barème explicitement fictif, vérification côté client et serveur, total sur 30. Après succès, relecture via consulter-participants ; une absence de confirmation de relecture est signalée explicitement. Les anciennes notes sont préremplies, zéro inclus. L’identité jury est déterminée côté serveur. Double envoi empêché ; déconnexion/expiration ferment la saisie et effacent les champs ; une réponse tardive ne réaffiche pas les données.

22 tests du Site réussis avec réseau substitué, dont 6 scénarios nouveaux de notation (saisie/relecture, modification/zéro, droits/participant retiré, validation, erreurs/relecture absente, double clic/déconnexion). Syntaxe et ressources vérifiées. Cache de coquille PWA versionné, toujours sans données ni API en cache.

Publication native `succeeded`, commit `324cce3d7b75a574a412669eaf4aaab8db608154`, déploiement `appgdep_6af79ed439488191a1c6987b9c4321e9`. Recette réelle à effectuer par l’utilisateur : jury → Camille → 8/9/7 → total 24 → actualiser et retrouver les notes. Aucune note réelle saisie par l’agent ; classement et e-mails non ajoutés à cette étape.

Fonction `noter-participant` : après les indications de déploiement et de réglage JWT, vérifications réelles sans écriture effectuées par l’agent : OPTIONS 204, POST sans jeton 401, POST avec jeton invalide 401. Le succès d’écriture et l’existence effective de save_scores restent à confirmer par une recette authentifiée. Préparation d’une mise à jour de `consulter-participants` pour renvoyer aussi les trois notes et leur date, toujours sans coordonnées pour le jury. 17 tests locaux avec réponses substituées réussis (consultation + notation). Mise à jour de consultation à déployer manuellement avant publication de l’interface de notes ; le formulaire de notation n’est pas encore disponible dans la PWA.

Étape notation : l’utilisateur confirme la création de la table `scores`. Le script `supabase/guided/05-save-scores.sql` prépare la fonction transactionnelle `save_scores`, réservée au serveur : vérification du rôle jury, verrou sur la participation, refus d’une participation retirée, insertion ou mise à jour du seul jeu de notes. Exécution de ce script encore à confirmer. Fonction de bord `noter-participant` préparée avec vérification Auth/role et identité jury imposée par le serveur ; pas encore déployée ni branchée dans la PWA. 10 tests locaux réussis avec réponses substituées ; aucune note réellement enregistrée dans Supabase par l’agent. La recette de notation et les e-mails restent à réaliser.

Recette utilisateur du 14 novembre 2026 : les deux rôles `organizer` et `jury` sont confirmés dans le résultat SQL ; connexion du compte jury, libellé Jury, présence de Camille Martin et absence de son adresse e-mail dans la vue explicitement confirmés. Les rôles distincts et la minimisation des coordonnées sont validés par ses observations. Préparation de `supabase/guided/04-scores.sql` pour créer le stockage des trois notes fictives entières de 0 à 10. La création de scores et la saisie de notes dans la PWA ne sont pas encore confirmées comme opérationnelles.

Préparation du compte jury : l’utilisateur a fourni l’UID distinct `19272bdf-cb63-4453-92b3-234b326632be`. Le script `supabase/guided/03-jury-role.sql` attribue `jury` à ce nouvel identifiant, sans modifier le rôle organisateur. L’exécution et les deux rôles retournés restent à confirmer par l’utilisateur. L’UID organisateur avait d’abord été recopié par erreur ; aucun changement de rôle n’a été effectué sur ce compte.

L’utilisateur a confirmé le résultat SQL avec son identifiant et `organizer`. Il a fourni la clé **publiable** du projet, conservée avec l’URL dans `supabase/guided/public-config.json` ; aucune clé secrète n’a été demandée ni fournie. La clé publique est destinée au client Auth ; elle ne doit pas être utilisée comme un rôle privilégié.

La fonction `consulter-participants` est préparée dans `supabase/functions/consulter-participants/index.ts`, sans déploiement confirmé. Elle vérifie le jeton auprès de Supabase Auth puis lit le rôle depuis team_users avec les accès serveur. Un compte sans rôle est refusé ; le jury ne reçoit pas les e-mails des participants. 6 tests locaux avec réponses substituées réussis (anonyme, session expirée, compte sans rôle, organisateur, jury, panne réseau). Aucune connexion au compte organisateur ni lecture réelle de participants n’a été exécutée par l’agent. Prochaine étape guidée : créer cette fonction via l’éditeur Supabase, puis préparer l’écran de connexion.

## Espace équipe publié

L’utilisateur a confirmé le déploiement de `consulter-participants` et la désactivation de la vérification JWT héritée ; le code continue à vérifier l’identité avec Supabase Auth avant tout accès métier. Vérifications réelles effectuées par l’agent : OPTIONS → 204 avec origine attendue ; GET sans jeton → 401 ; GET avec jeton de test invalide → 401. Aucun mot de passe organisateur demandé, aucune session utilisateur créée par l’agent, aucune lecture réelle d’inscriptions.

Écran ajouté au Site : https://four-du-canal-exercice.leeloog4.chatgpt.site/equipe.html. Connexion directement à Supabase Auth avec la clé publiable ; liste récupérée uniquement via la fonction protégée. Jeton uniquement en mémoire, pas de persistance navigateur ; la fermeture, le rechargement, l’expiration et la déconnexion effacent la vue. L’accès privé Sites est conservé. La version hébergée équipe permet la lecture seulement ; notes, classement et modification des statuts restent à construire par étapes.

Tests du Site exécutés : 12 réussis (5 formulaire et 7 connexion, avec réseau substitué), syntaxe des deux scripts et ressources des deux pages vérifiées. Aucune recette visuelle revendiquée. Publication native `succeeded`, commit `458ccd8766629985c04730f4ddf3564610cb89ea`, déploiement `appgdep_6af794bd75f481919bd2936eed885c17`. Prochaine vérification par l’utilisateur : se connecter avec son compte organisateur et retrouver Camille dans la liste.

### Connexion organisateur confirmée

Recette utilisateur du 14 novembre 2026 : Camille Martin est visible après connexion sur `/app/`. L’utilisateur a ensuite confirmé l’installation de la PWA depuis Chrome sur ordinateur. La nouvelle adresse et l’installation sur ce navigateur sont validées par ses observations ; ouverture autonome depuis l’icône et installation mobile non vérifiées séparément. Le compte jury n’est pas encore confirmé comme créé. Prochaine étape guidée : créer un compte Supabase Auth distinct, puis attribuer le rôle jury à son UID.

Mise à jour du 14 novembre 2026 : l’espace équipe se trouve maintenant dans l’application `/app/`, préparée en PWA. `/equipe.html` redirige vers cette adresse. Les fonctions Supabase, comptes, rôles et règles de protection sont conservés. La landing page ne contient plus de lien équipe. Le cache PWA est limité aux ressources statiques de l’écran de connexion et n’intercepte pas Supabase ; installation native à tester. La connexion à cette nouvelle adresse attend une confirmation utilisateur.

L’utilisateur a explicitement confirmé voir Camille Martin dans la liste après connexion sur l’espace équipe. La connexion Supabase Auth, l’autorisation du rôle organisateur et la lecture des inscriptions via la fonction sont donc validées par sa recette dans le navigateur. L’agent n’a reçu ni saisi son mot de passe. Déconnexion et disparition de la liste restent à vérifier manuellement.

L’utilisateur a ensuite explicitement confirmé qu’après « Se déconnecter », la liste disparaît et le formulaire de connexion revient. La déconnexion visuelle est validée par sa recette ; cette observation ne constitue pas une vérification indépendante de la révocation réseau du jeton. La prochaine étape est la création d’un compte jury distinct avant l’ajout de la notation fictive.
