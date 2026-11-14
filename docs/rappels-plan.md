# Prochaine étape : traitement des rappels

État courant : activation signalée par l’utilisateur, recette métier du rappel dû encore à vérifier. Les sections de préparation ci-dessous retracent les étapes.

Conserver email_jobs comme file métier et Brevo exclusivement côté serveur. Une fonction Supabase dédiée traitera les tâches dues, avec la réclamation atomique dédiée claim_reminders. Un déclencheur Supabase Cron appellera cette fonction même si la PWA est fermée ; aucun Make.

L’appel du planificateur devra être authentifié avec un secret technique conservé côté Supabase, jamais dans la PWA ou GitHub. Aucun nouvel essai automatique après résultat incertain ou acceptation. Une participation retirée ne doit pas être envoyée ; un rappel après l’événement doit être ignoré. Les états et identifiants fournisseur doivent être enregistrés sans confondre acceptation et livraison.

Avant activation : écrire et tester la fonction sans réseau fournisseur réel, vérifier la disponibilité de Cron dans le tableau de bord, puis guider la configuration du secret et du déclencheur. Recette finale avec message de démonstration contrôlé, application fermée, vérification des états, des doublons et du retrait. Ne pas avancer l’échéance des rappels des inscrits pour tester.

## Sources préparées le 14 novembre 2026

- `supabase/guided/09-claim-reminders.sql` : nouvelle RPC service_role uniquement, horloge PostgreSQL, rappels pending dus uniquement, deux tâches maximum avec SKIP LOCKED. Les confirmations et les états déjà traités ne sont pas repris. Annulation des rappels pending si retrait ou événement passé.
- `supabase/functions/traiter-rappels/index.ts` : POST serveur avec en-tête `x-cron-secret` égal au secret `REMINDERS_CRON_SECRET` (au moins 32 caractères), sans CORS public. Le corps de requête ne fournit ni destinataire ni horloge. Nécessite `REMINDERS_ENABLED=true` pour traiter ; sinon retourne enabled:false sans accès base ni fournisseur.
- Secrets Brevo existants réutilisés côté serveur. EVENT_AT doit être identique à celui de l’inscription si sa valeur est personnalisée.
- La fonction relit le statut avant envoi, simule les domaines réservés et distingue accepted/failed/uncertain. Une tâche processing après interruption n’est jamais reprise automatiquement ; contrôle manuel base et Brevo requis. La relecture réduit la fenêtre de retrait concurrent sans rendre atomiques un appel Brevo externe et une transaction PostgreSQL.

## Parcours de mise en place restant

1. Appliquer uniquement 09 dans l’Éditeur SQL ; vérifier son succès (aucun envoi).
2. Créer la fonction `traiter-rappels` avec tout le fichier index.ts ; désactiver la vérification JWT héritée, car le secret serveur authentifie cet endpoint. Ne pas encore définir REMINDERS_ENABLED=true.
3. Générer un secret fort et le stocker dans les secrets des fonctions ainsi que dans Supabase Vault pour Cron ; ne jamais le transmettre dans la conversation ni le versionner. Configurer l’appel HTTP pg_net avec lecture du secret depuis Vault.
4. Tester l’accès refusé et l’appel authentifié avec enabled:false, puis configurer une tâche chaque minute (débit maximal deux rappels par minute pour ce petit exercice).
5. Valider la recette contrôlée avant activation. Le prochain rappel métier reste prévu au 3 décembre à 15 h Paris. Aucun rappel réel d’inscrit ne doit être avancé pour la recette.

Aucun de ces déploiements, secrets, appels Cron ou envois de rappel n’est revendiqué comme réalisé. La RPC n’a pas été exécutée sur PostgreSQL par l’agent ; concurrence et échéances SQL restent à vérifier sur Supabase. Les tests JavaScript utilisent des réponses réseau substituées.


## Progression guidée

SQL 09, fonction et secrets serveur/Vault signalés comme configurés par l’utilisateur ; test authentifié désactivé confirmé. Script 10 préparé, non exécuté par l’agent, pour créer la tâche Cron sans changer REMINDERS_ENABLED. Sa commande ne contient que le nom du secret Vault. Le contrôle suivant devra vérifier une réponse HTTP 200 avec enabled:false, et pas seulement le statut SQL du job Cron.

Pour suspendre ultérieurement le déclencheur : `select cron.unschedule('four-du-canal-rappels');`. Pour couper immédiatement le traitement sans supprimer la tâche, conserver `REMINDERS_ENABLED=false` dans les secrets de fonctions. Aucun de ces changements ne doit être présenté comme effectué sans confirmation.


## Recette du rappel dû — préparation

Tâche Cron créée selon l’utilisateur ; capture montrant quatre invocations sans erreur, puis confirmation du statut HTTP 200 dans les journaux. Refus sans secret confirmé après test guidé. L’utilisateur signale avoir enregistré REMINDERS_ENABLED=true. Aucun rappel métier traité n’est encore prouvé.

Le script 11 crée atomiquement Test Cron Fictif / recette-rappel-cron@example.test, une confirmation déjà simulée et un rappel pending dû depuis une minute. L’adresse .test est réservée : le worker enregistre simulated sans appel fournisseur. Le script refuse de recréer ce test ; il ne change ni les dates ni les tâches des autres inscrits. Le script 12 lit uniquement cette recette. Attendu après Cron : rappel simulated, attempts=1, message_id NULL et processed_at renseigné. Refaire uniquement la lecture après une autre minute : attempts doit rester à 1. La PWA peut rester fermée pendant la recette. Si événement déjà passé, skipped est attendu à la place : cette recette est prévue avant le 4 décembre 2026 à 14 h UTC.

Après vérification, retirer Test Cron Fictif via le compte organisateur afin de le conserver dans la traçabilité sans le laisser actif. Le scénario prouve le traitement planifié simulé ; il ne prouve ni un appel Brevo de rappel ni sa livraison. La réception réelle du message de confirmation a été vérifiée séparément.


Preuve reçue : capture du rappel simulated, attempts=1, message_id NULL, processed_at au 14 novembre 2026 à 15:37 UTC. Le traitement dû simulé est vérifié. La seconde lecture pour absence de retraitement reste à faire ; aucune livraison réelle de rappel revendiquée.

Clôture guidée : seconde lecture avec attempts=1 confirmée par l’utilisateur, puis retrait de Test Cron Fictif signalé comme effectué. Recette planifiée simulée validée ; fermeture de PWA non confirmée séparément, aucune réception réelle de rappel revendiquée.
