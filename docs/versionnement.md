# Versionnement consolidé — 14 novembre 2026

Ce dépôt réunit le site/PWA, les fonctions Supabase, les scripts SQL, la documentation, les tests et une archive du prototype local initial. L’historique Git du site a été conservé par clonage local, sans réécriture ni suppression des commits.

Le dépôt principal est désormais [Leeloog4/le-four-du-canal](https://github.com/Leeloog4/le-four-du-canal), privé, sur la branche `main`. Il correspond au remote `origin`. Le dépôt de publication Sites reste le remote `sites` ; aucune authentification n’est stockée dans les fichiers. Les sources complètes et l’historique du site sont conservés sans réécriture.

Historique du raccordement : connexion Leeloog4 confirmée, mais création depuis l’intégration refusée (« Resource not accessible by integration »). L’utilisateur a créé le dépôt vide et fourni son URL ; le caractère privé, l’absence de branche initialisée et les droits de push ont été vérifiés avant le transfert. Le remote origin est ajouté à cette copie pour le premier push. Contrôle ciblé de l’historique complet effectué : 111 versions de fichiers texte, aucune clé secrète reconnaissable ni base locale.

Le dossier initial Sites `/workspace/sites/four-du-canal-demo` et le dossier de travail initial `/workspace/le-four-du-canal` sont conservés comme références, sans déplacement. La source de travail principale est `/workspace/four-du-canal-github`. Ne pas modifier les anciennes copies comme des projets parallèles. Toute prochaine modification du site, de la PWA, des fonctions ou du SQL doit être commitée et poussée dans le dépôt GitHub principal. Les publications Sites doivent provenir du même état source, poussé séparément vers le remote sites avant publication.

Les fonctions Supabase, dont inscrire-participant avec confirmation, ont été déployées manuellement selon la recette utilisateur. La publication Sites ne déploie pas ces fonctions. `DEPLOYMENT.md` distingue les fonctions déployées du travail en attente. Les scripts SQL déjà appliqués sont conservés ; ne pas relancer les scripts guidés en bloc.

Les clés privilégiées, jetons, bases et exports sont exclus. La clé publiable Supabase est nécessaire au navigateur et n’est pas un secret. Les données de démonstration stockées dans Supabase n’ont pas été exportées.
