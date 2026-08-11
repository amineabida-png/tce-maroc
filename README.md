# ERP TCE Maroc

Application de gestion pour société de travaux Tous Corps d'État (TCE), bâtiment et aménagement au Maroc — chantiers, devis/facturation, achats/stock, RH, finances, reporting.

Monorepo :
- `backend/` — API Node.js + Express + TypeScript + Prisma (PostgreSQL)
- `frontend/` — React + Vite + TypeScript + TailwindCSS + composants shadcn/ui

En production, un seul service sert les deux : le backend compile et sert le build statique du frontend.

## État d'avancement

- [x] Squelette (backend + frontend), auth JWT (access + refresh, rotation), RBAC, module Société (paramètres légaux, TVA, retenues, numérotation)
- [ ] Clients / Fournisseurs
- [ ] Chantiers
- [ ] Devis & Facturation
- [ ] Achats & Stock
- [ ] RH & Pointage
- [ ] Finances
- [ ] Reporting
- [ ] Dashboard

Construit module par module — voir les commits pour le détail de chaque étape.

## Installation locale

Prérequis : Node.js ≥ 18, un accès à une base PostgreSQL.

```bash
npm run install:all        # installe backend/ et frontend/

cp backend/.env.example backend/.env
# éditer backend/.env : DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET (voir ci-dessous)

cd backend
npx prisma migrate deploy  # applique les migrations (voir note ci-dessous si base partagée)
npm run prisma:seed        # crée les paramètres société par défaut + le premier compte admin
cd ..

npm run dev:backend        # terminal 1 — API sur :3000 (ou PORT défini)
npm run dev:frontend       # terminal 2 — frontend sur :5173, proxy /api vers le backend
```

Le mot de passe du compte admin créé par le seed est affiché **une seule fois** dans les logs (sauf si `ADMIN_PASSWORD` est défini dans `.env`).

## Variables d'environnement (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `JWT_SECRET` | Secret de signature des jetons d'accès (aléatoire, ≥ 32 caractères) |
| `JWT_REFRESH_SECRET` | Secret de signature des refresh tokens — **différent** de `JWT_SECRET` |
| `JWT_ACCESS_TTL` | Durée de vie du jeton d'accès (défaut `15m`) |
| `JWT_REFRESH_TTL_DAYS` | Durée de vie du refresh token en jours (défaut `30`) |
| `PORT` | Port d'écoute (Railway l'injecte automatiquement) |
| `NODE_ENV` | `development` / `production` |
| `FRONTEND_URL` | Origine autorisée en CORS si le frontend est servi séparément (vide si même origine) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optionnels, utilisés uniquement par `prisma/seed.ts` |

Générer un secret : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Base de données partagée — note importante sur les migrations

Ce service utilise une instance PostgreSQL **partagée** avec d'autres applications du même projet Railway, isolée dans son propre schéma (`tce_maroc`, via la preview feature Prisma `multiSchema`). Conséquence : `prisma migrate dev` refuse de s'exécuter (erreur **P3005 « database schema is not empty »**) car Prisma vérifie l'état de la base entière, pas seulement notre schéma.

Pour créer une **nouvelle** migration sur cette base :

```bash
# 1. Générer le SQL de la migration sans l'appliquer
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/diff.sql
# (en pratique : modifier schema.prisma, puis comparer l'état actuel de la base
#  à l'état désiré — voir la doc Prisma "migrate diff" pour la syntaxe --from-url)

# 2. Créer le dossier de migration manuellement
mkdir -p prisma/migrations/$(date -u +%Y%m%d%H%M%S)_nom_de_la_migration
# y placer le migration.sql généré

# 3. Appliquer directement le SQL (sûr : ne touche que le schéma tce_maroc)
npx prisma db execute --file prisma/migrations/<dossier>/migration.sql --schema prisma/schema.prisma

# 4. Marquer la migration comme appliquée dans l'historique Prisma
npx prisma migrate resolve --applied <nom_du_dossier>
```

En production (`npm run prisma:migrate:deploy`), une fois l'historique correctement baselined, les migrations suivantes s'appliquent normalement tant qu'elles ne recréent pas cette situation.

## Commandes utiles (`backend/`)

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev avec rechargement (tsx watch) |
| `npm run build` | Compile le backend + copie le build du frontend dans `dist/public` |
| `npm start` | Lance la version compilée (`dist/server.js`) |
| `npm run prisma:migrate:deploy` | Applique les migrations en attente |
| `npm run prisma:seed` | Amorce société + compte admin |
| `npm test` | Tests d'intégration (Vitest + Supertest) |
| `npm run lint` | ESLint |

## Sécurité

- Mots de passe hachés avec bcrypt (12 rounds)
- Jamais d'inscription publique — comptes créés par un administrateur
- Jetons d'accès courte durée + refresh tokens rotatifs et révocables individuellement
- Rate limiting dédié sur `/api/auth/login`, limite globale sur `/api`
- En-têtes de sécurité via `helmet`
- Validation stricte des entrées (Zod) côté API
- Journal d'audit (`JournalAudit`) des actions sensibles

## Déploiement

Voir la section dédiée ajoutée à la fin de ce README une fois le squelette déployé (service Railway `tce-maroc` dans le projet `practical-grace`).
