# Prochaine étape : traitement des rappels

État : préparation d’architecture, aucune activation.

Conserver email_jobs comme file métier et Brevo exclusivement côté serveur. Une fonction Supabase dédiée traitera les tâches dues, en réutilisant la réclamation atomique claim_emails. Un déclencheur Supabase Cron appellera cette fonction même si la PWA est fermée ; aucun Make.

L’appel du planificateur devra être authentifié avec un secret technique conservé côté Supabase, jamais dans la PWA ou GitHub. Aucun nouvel essai automatique après résultat incertain ou acceptation. Une participation retirée ne doit pas être envoyée ; un rappel après l’événement doit être ignoré. Les états et identifiants fournisseur doivent être enregistrés sans confondre acceptation et livraison.

Avant activation : écrire et tester la fonction sans réseau fournisseur réel, vérifier la disponibilité de Cron dans le tableau de bord, puis guider la configuration du secret et du déclencheur. Recette finale avec message de démonstration contrôlé, application fermée, vérification des états, des doublons et du retrait. Ne pas avancer l’échéance des rappels des inscrits pour tester.
