# eFootball Madagascar — site officiel (Next.js + Supabase)

## Mise en route
1. Crée un projet gratuit sur supabase.com.
2. SQL Editor : exécute dans l'ordre `schema.sql`, `extensions.sql` (tournois, actualités), `seed.sql` (39 équipes, 284 joueurs) puis `seed-extra.sql` (transferts, champions, tournois, actualités).
3. Authentication > Users : crée 2 comptes admin, puis exécute `insert into admins(user_id) values ('UUID');` pour chacun.
4. `cp .env.example .env.local` et colle l'URL et la clé anon (Settings > API).
5. `npm install && npm run dev` → http://localhost:3000 · admin : /admin
6. Mise en ligne : GitHub → vercel.com (ajoute les 3 variables d'environnement) → ton nom de domaine.

## Actualités automatiques
Un transfert, un résultat, un champion, un nouveau joueur ou une nouvelle saison publié par un admin crée son actualité tout seul. Les autres annonces se publient dans /admin/actualites.

## Photos
Les nouvelles photos sont recadrées en carré, converties en WebP et réduites à ~50 Ko automatiquement (limite d'envoi : 4 Mo).
Pour rapatrier les anciennes photos (ibb.co et dossier `images/players`) :
`npm i && SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-photos.mjs ../cem-site/images`
(Les photos locales sont lues dans `images/players/` de l'ancien site. La clé service_role reste privée.)

## Régénérer les données depuis l'ancien site
`node scripts/make-seed.mjs ../cem-site`

## Reste à faire (phases suivantes du cahier des charges)
comptes présidents d'équipe et version malgache (phase 2). Le sitemap (`/sitemap.xml`) et `robots.txt` sont générés automatiquement ; après la mise en ligne, déclare le sitemap dans Google Search Console.
Guide pour les administrateurs : `GUIDE-ADMIN.md`.
Deux plateformes (Mobile et Console) : 8 ligues en base. Les équipes de ton ancien site sont placées côté Mobile ; crée les équipes Console dans /admin/equipes.
Les règles (3 montées, 3 descentes) sont dans la table `settings`, pas dans le code.
