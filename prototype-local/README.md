# Prototype local initial — archive de travail

Cette version Node/SQLite a servi aux premières vérifications avant le déploiement Sites/Supabase. La version active du site et de la PWA se trouve dans ../dist ; les fonctions actives ou préparées sont dans ../supabase. Les fonctionnalités locales ne prouvent pas qu’elles sont activées en hébergement.

Node 24 requis, sans dépendance npm. Depuis ce dossier :

```sh
cp .env.example .env
npm run setup-demo
npm start
```

Ouvrir http://localhost:3000. Les comptes et mots de passe aléatoires sont affichés par setup-demo ; aucune donnée ou clé réelle incluse. E-mails simulés par défaut. Stockage local dans data/, exclu du versionnement. Tests : npm test.

Ne pas utiliser cette copie pour remplacer le site hébergé ni appliquer sa configuration Vercel sans reprendre les décisions documentées dans ../docs.
