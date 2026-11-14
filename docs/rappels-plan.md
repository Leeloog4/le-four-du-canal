# Prochaine étape : traitement des rappels

État : préparation d’architecture, aucune activation.

Conserver email_jobs comme file métier et Brevo exclusivement côté serveur. Une fonction Supabase dédiée traitera les tâches dues, en réutilisant la réclamation atomique claim_emails. Un déclencheur Supabase Cron appellera cette fonction même si la PWA est fermée ; aucun Make.

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
