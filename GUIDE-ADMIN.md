# Guide d'utilisation — Administrateurs eFootball Madagascar

Ce guide explique comment gérer le site sans toucher au code. Tout se passe dans l'espace administrateur : **votre-site/admin**.

## 1. Se connecter
1. Ouvrez `/admin` et entrez votre e-mail et votre mot de passe.
2. Le menu en haut donne accès à : **Joueurs**, **Équipes**, **Résultats**, **Tournois**, **Actualités**.
3. Cliquez sur « Se déconnecter » en fin de session, surtout sur un téléphone partagé.

Si le mot de passe est refusé, vérifiez l'e-mail. Seuls les comptes déclarés administrateurs peuvent modifier le site. Il doit toujours y avoir **au moins deux administrateurs**.

## Plateformes : Mobile et Console
Le site a deux championnats séparés : **Mobile** et **Console**, chacun avec 4 ligues de 10 équipes. Les visiteurs choisissent leur plateforme avec le sélecteur en haut de la page ; il change les pages Compétitions et Équipes. Pour mettre une équipe dans un championnat, choisissez sa ligue dans **Équipes** (par exemple « Ligue 2 · Console »). Les montées et descentes se font à l'intérieur de chaque plateforme.

## 2. Saisir un résultat de match (page d'accueil admin)
1. Choisissez l'équipe A et l'équipe B, puis les buts de chacune.
2. Indiquez la date (sinon, aujourd'hui) et cliquez sur « Enregistrer le résultat ».
3. Le classement se met à jour tout seul : victoire = 3 points, nul = 1, défaite = 0. À égalité, on compare la différence de buts, puis les buts marqués.

Les deux équipes doivent être de la même ligue. Une actualité « Résultat » est publiée automatiquement.

**Corriger ou supprimer un résultat** : menu **Résultats**, cliquez sur le match, changez les équipes, les buts ou la date, puis « Enregistrer la correction ». Pour le supprimer, cochez la case de confirmation. Le classement est recalculé tout de suite. Une correction ne publie pas de nouvelle actualité.

## 3. Enregistrer un transfert
1. Choisissez le joueur et sa **nouvelle** équipe (ou « Sans équipe »).
2. Choisissez le type (Transfert, Prêt, Libre, Fin de contrat) et, si besoin, le montant en Ariary.
3. Cliquez sur « Valider le transfert ». L'équipe du joueur change et la ligne est ajoutée à l'historique.

## 4. Gérer les joueurs (menu Joueurs)
- **Ajouter** : depuis la page d'accueil admin. Si le nom existe déjà, un avertissement s'affiche. Cochez « Ajouter quand même » seulement s'il s'agit d'une autre personne.
- **Modifier** : cherchez le joueur, cliquez dessus, changez les champs (équipe, force, valeur, clause, contrat, ville, photo) puis « Enregistrer ».
- **Supprimer** : en bas de la fiche, cochez la case de confirmation. Le contrat et les transferts du joueur sont effacés aussi.

Pour changer l'équipe d'un joueur avec un historique, utilisez plutôt un **transfert** (section 3).

### Photos et droit à l'image
- Publiez une photo seulement avec l'accord du joueur.
- Les photos sont réduites automatiquement (environ 50 Ko). Taille maximale d'envoi : 4 Mo.
- Pour une demande de retrait : ouvrez la fiche, cochez « Retirer la photo », enregistrez.

## 5. Gérer les équipes (menu Équipes)
- Quatre compteurs montrent le nombre d'équipes par ligue sur 10 (vert = complète, jaune = incomplète).
- **Créer** : nom, ligue, couleur, logo. **Modifier** : cliquez sur l'équipe. Pour retirer une équipe d'une ligue, choisissez « Hors ligue ».
- **Supprimer** : impossible si l'équipe a déjà des matchs. Retirez-la de sa ligue à la place. Ses joueurs passent « sans équipe ».
- Une ligue avec plus de 10 équipes provoque un avertissement : corrigez avant la fin de saison.

## 6. Fin de saison (bouton rouge, page d'accueil admin)
**Action définitive : à faire une seule fois, quand tous les résultats sont saisis.**
1. Vérifiez les classements des 4 ligues sur la page Compétitions.
2. Vérifiez que chaque ligue a ses 10 équipes.
3. Cliquez sur « Terminer la saison ».

Le site désigne les champions, fait monter les 3 premiers de chaque ligue inférieure, fait descendre les 3 derniers de chaque ligue supérieure, remet les classements à zéro et ouvre la saison suivante. Les anciens résultats restent conservés. Une actualité est publiée.

## 7. Tournois et coupes (menu Tournois)
1. Créez le tournoi (nom, description).
2. Ouvrez-le, puis ajoutez les matchs. Sans score, le match apparaît comme « à venir ». Une fois joué, ouvrez le tournoi, cliquez sur « Corriger » à côté du match et ajoutez le score.
3. Le classement se calcule tout seul. Désignez le champion (équipe, joueur, image) à la fin du tournoi.

## 8. Actualités (menu Actualités)
Les transferts, résultats, champions, nouveaux joueurs et nouvelles saisons publient **leur actualité automatiquement**. Pour une annonce libre (événement, mise à jour, conseil), écrivez un titre, choisissez une catégorie et cliquez sur « Publier ». Une actualité s'efface avec « Supprimer ».

## 9. Journal des modifications
Chaque ajout, modification ou suppression de joueur, d'équipe ou de match est enregistré avec son auteur et sa date. Il se consulte dans la table `admin_logs` de Supabase (Table Editor).

## 10. Bonnes pratiques
- Un résultat saisi par erreur se corrige depuis le menu **Résultats** (ligues) ou **Tournois** (tournois).
- Évitez de modifier les équipes en pleine saison, sauf correction d'une faute.
- Changez votre mot de passe si vous pensez qu'il a été vu par quelqu'un d'autre.
- Les sauvegardes de la base sont gérées par Supabase. Consultez régulièrement l'état de votre projet sur supabase.com.

## 11. Problèmes fréquents
| Message | Solution |
|---|---|
| « Accès réservé aux administrateurs » | Votre compte n'est pas dans la table `admins`. Demandez à un autre admin de l'ajouter. |
| « Une équipe nommée … existe déjà » | Choisissez un autre nom ou modifiez l'équipe existante. |
| « Doublon : … existe déjà » | Vérifiez si le joueur est déjà inscrit, sinon cochez « quand même ». |
| « Photo refusée » | Utilisez un fichier JPG ou PNG de moins de 4 Mo. |
| Le site n'affiche pas le changement | Attendez une minute : les pages se rafraîchissent chaque minute. |
