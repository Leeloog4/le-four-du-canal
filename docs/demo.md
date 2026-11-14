# Démonstration guidée — environ cinq minutes

Préparer Node 24, copier `.env.example` en `.env`, exécuter `npm run setup-demo` et conserver les deux mots de passe affichés. Lancer `npm start`. Garder `EMAIL_MODE=simulated`.

1. Ouvrir http://localhost:3000. Montrer la mention de prototype, la date fictive et le lieu fictif. Expliquer le lien possible depuis WordPress.
2. Soumettre un e-mail mal formé : montrer la validation. Inscrire Camille Martin avec `camille@example.test`. Montrer la référence et « e-mail simulé, aucun envoi ».
3. Soumettre à nouveau la même adresse : montrer le refus du doublon sans nouvelle inscription.
4. Ouvrir `/equipe` et se connecter avec `organisateur@demo.test`. Montrer la liste, puis l’onglet E-mails : confirmation simulée et rappel à J−1 en attente, contenu et destinataire accessibles. Aucune prétention d’envoi.
5. Se déconnecter. Se connecter avec `jury@demo.test`. Vérifier l’absence d’adresse e-mail, saisir goût 8, texture 9, présentation 7. Afficher le classement : 24/30. Préciser que les critères sont fictifs.
6. Facultatif : inscrire une seconde personne fictive, saisir un autre jeu de notes de somme 24 et montrer l’ex æquo.
7. Revenir comme organisateur, retirer Camille, montrer son exclusion du classement et l’annulation du rappel encore en attente.
8. Expliquer les limites : rendu navigateur à vérifier, services externes non configurés, timer local actif seulement lorsque Node tourne. Montrer `docs/recette.md` et les tests exécutés.

## Exercer un rappel sans attendre décembre

Utiliser une **base de démonstration distincte** (`DATABASE_PATH=./data/rappel-demo.sqlite`). Fixer `EVENT_AT` à l’heure actuelle + 24 h + 2 minutes, sous forme ISO avec fuseau ou UTC ; garder la mention fictive et le mode simulé. Redémarrer, créer les comptes de cette base puis inscrire une personne fictive. Observer le rappel en attente, attendre l’échéance avec Node actif, actualiser l’onglet E-mails : le statut doit devenir Simulé. Cet exercice est un protocole à réaliser, pas un test manuel déjà effectué.

Ne jamais avancer l’heure de la machine ni modifier les tâches d’une base contenant de vraies inscriptions pour une démonstration.
