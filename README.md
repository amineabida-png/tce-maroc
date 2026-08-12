# ERP TCE Maroc

Application de gestion pour société de travaux Tous Corps d'État (TCE), bâtiment et aménagement au Maroc — chantiers, devis/facturation, achats/stock, RH, finances, reporting.

Monorepo :
- `backend/` — API Node.js + Express + TypeScript + Prisma (PostgreSQL)
- `frontend/` — React + Vite + TypeScript + TailwindCSS + composants shadcn/ui

En production, un seul service sert les deux : le backend compile et sert le build statique du frontend.

## État d'avancement

- [x] Squelette (backend + frontend), auth JWT (access + refresh, rotation), RBAC, module Société (paramètres légaux, TVA, retenues, numérotation)
- [x] Clients / Fournisseurs / Sous-traitants (CRM léger, CRUD, recherche, suppression douce, RBAC par rôle)
- [x] Chantiers (fiche, planning type Gantt simplifié, dépenses, suivi budgétaire prévu/réel)
- [x] Devis & Facturation (BPU, devis par lots, conversion devis→commande→facture, retenue de garantie, paiements, impayés)
- [x] Achats & Stock (commandes fournisseurs, réception partielle/totale, stock et valorisation CMP calculés depuis les mouvements)
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

Procédure testée et utilisée pour chaque migration de ce projet — pour créer une **nouvelle** migration sur cette base :

```bash
# 0. Modifier prisma/schema.prisma (ajouter/changer des modèles)

# 1. Générer le SQL en comparant l'état RÉEL de la base (--from-url) à l'état désiré du schéma
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/diff.sql
# Relire /tmp/diff.sql avant de continuer : ne doit contenir QUE des
# CREATE/ALTER sur le schéma tce_maroc, rien sur les autres apps.

# 2. Créer le dossier de migration et y copier le SQL
MIGDIR="prisma/migrations/$(date -u +%Y%m%d%H%M%S)_nom_de_la_migration"
mkdir -p "$MIGDIR" && cp /tmp/diff.sql "$MIGDIR/migration.sql"

# 3. Appliquer directement le SQL (sûr : ne touche que le schéma tce_maroc)
npx prisma db execute --file "$MIGDIR/migration.sql" --schema prisma/schema.prisma

# 4. Marquer la migration comme appliquée dans l'historique Prisma
npx prisma migrate resolve --applied "$(basename "$MIGDIR")"

# 5. Régénérer le client
npx prisma generate
```

En production, `npm start` exécute `prisma migrate deploy` automatiquement au démarrage : une fois l'historique correctement baselined via la procédure ci-dessus, les migrations suivantes s'appliquent normalement au déploiement.

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

- **GitHub** : [amineabida-png/tce-maroc](https://github.com/amineabida-png/tce-maroc)
- **Railway** : service `tce-maroc` dans le projet `practical-grace` — https://tce-maroc-production.up.railway.app
- **Base de données** : Postgres partagé du projet (`${{Postgres.DATABASE_URL}}`), schéma dédié `tce_maroc`

Le service exécute automatiquement au démarrage : `prisma migrate deploy` (migrations en attente) puis `prisma/seed.ts` (idempotent — société + admin par défaut si absents), avant de lancer le serveur.

Variables définies sur Railway : `DATABASE_URL` (référence au service Postgres), `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS`, `NODE_ENV=production`. `PORT` est injecté automatiquement par Railway.

### Checklist de vérification post-déploiement

- [x] `GET /health` → `{"status":"ok"}`
- [x] `GET /` → sert le frontend (build React)
- [x] `POST /api/auth/login` avec le compte admin → jetons valides
- [x] `GET /api/auth/me` sans jeton → 401
- [x] `PUT /api/societe` avec un rôle non-admin → 403 (RBAC)
- [ ] Génération d'un devis en PDF — à vérifier une fois le module Devis construit
