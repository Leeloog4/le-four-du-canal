# Le Four du Canal — aperçu privé

Aperçu visuel isolé du prototype local.
Date : 4 décembre 2026 à 15 h (Paris).
Lieu fictif : Atelier du Canal, 12 rue des Gourmands, 75010 Paris.

Le formulaire transmet prénom, nom et e-mail à la fonction serveur Supabase inscrire-participant. Elle vérifie les champs et enregistre une ligne dans participants ; une adresse normalisée est unique. Seul un retour réussi du serveur déclenche le message de confirmation. Les clés privilégiées restent dans Supabase. Aucun e-mail n’est envoyé, aucun classement ou accès équipe n’est exposé.

Projet Supabase : https://xeeixhbhfsdxrgeotlix.supabase.co. La fonction a été déployée par l’utilisateur depuis l’éditeur, vérification JWT désactivée pour l’inscription publique, validation et contrôle d’origine dans la fonction. Le Site reste privé. Les données sont de démonstration ; aucune ouverture publique n’est effectuée.

Vérifications de connexion exécutées : OPTIONS depuis l’origine du Site → 204 ; POST vide → 422. Aucun participant créé par ces vérifications. Les tests du formulaire utilisent un substitut de réponse réseau, et ne valent pas une inscription réelle dans Supabase. Prochaine recette : inscription fictive depuis le Site, contrôle de la ligne dans Table Editor puis essai doublon.

Le projet complet local avec rôles et classement reste dans /workspace/le-four-du-canal.

Publication statique via Sites ; accès propriétaire privé.
