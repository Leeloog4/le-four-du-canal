# Versionnement consolidé — 14 novembre 2026

Ce dépôt réunit le site/PWA, les fonctions Supabase, les scripts SQL, la documentation, les tests et une archive du prototype local initial. L’historique Git du site a été conservé par clonage local, sans réécriture ni suppression des commits.

Le dépôt Git distant actuellement connu est celui de Sites. Il est enregistré comme remote `sites` dans cette copie ; aucune authentification n’est stockée dans les fichiers. Le dépôt GitHub privé et son remote `origin` ne sont pas encore créés : l’accès GitHub doit être connecté et autorisé.

La connexion GitHub au compte Leeloog4 a ensuite été confirmée par le profil connecté et le CLI. La tentative de création du dépôt privé Leeloog4/le-four-du-canal a été refusée par GitHub : « Resource not accessible by integration (createRepository) ». Il s’agit d’une limite de permissions de l’intégration, pas d’une absence de connexion. Le dépôt local est prêt ; création du dépôt vide via l’interface GitHub par l’utilisateur nécessaire avant ajout du remote et push. Aucun dépôt distant créé ni source envoyée lors de cette tentative. Contrôle ciblé de l’historique complet effectué : 111 versions de fichiers texte, aucune clé secrète reconnaissable ni base locale.

Le dossier source de déploiement Sites `/workspace/sites/four-du-canal-demo` et le dossier de travail initial `/workspace/le-four-du-canal` sont conservés sans déplacement. Cette copie consolidée est `/workspace/four-du-canal-github`. Ne pas entretenir ces copies comme des branches divergentes : après création du dépôt GitHub, choisir ce dépôt consolidé comme source de travail et synchroniser explicitement le déploiement Sites depuis le même état source.

La version préparée localement d’inscrire-participant n’est pas encore appliquée à Supabase. `DEPLOYMENT.md` distingue les fonctions déployées du travail en attente. Les scripts SQL déjà appliqués sont conservés ; ne pas relancer les scripts guidés en bloc.

Les clés privilégiées, jetons, bases et exports sont exclus. La clé publiable Supabase est nécessaire au navigateur et n’est pas un secret. Les données de démonstration stockées dans Supabase n’ont pas été exportées.
