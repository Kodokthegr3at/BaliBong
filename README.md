# Bali Bong — Digital Menu Platform

Full-stack website and digital menu for **Bali Bong**, an Indonesian/Balinese restaurant in Osaka, Japan. Customers reach the menu by scanning a QR code at their table; staff manage the menu, restaurant info, and table QR codes through an admin panel — no developer needed for day-to-day changes.

**Live:** https://balibong.vercel.app

## Features

- Homepage and digital menu in 5 languages: Indonesian, Japanese, Chinese, Korean, Spanish
- 73-item menu across 8 categories, with a recommended-dishes spotlight
- Admin panel: menu CRUD, restaurant info editing, QR code generation, image uploads
- JWT-authenticated admin API with rate-limited login
- Server-side rendered (Angular SSR) for fast first paint and SEO

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (SSR/prerendering, standalone components, signals) |
| Backend | Node.js + Express |
| Database | PostgreSQL, hosted on [Neon](https://neon.tech) |
| File storage | [Vercel Blob](https://vercel.com/docs/vercel-blob) |
| Hosting | [Vercel](https://vercel.com) (frontend as static/SSR build, backend as serverless functions) |

## Project structure

```
BaliBong/
├── frontend/        Angular app (home, menu, admin pages)
├── backend/         Express API (menu, restaurant info, admin, auth)
│   ├── routes/       menu.js, restaurant.js, admin.js
│   ├── schema.sql     Postgres schema
│   └── seed.js         Seeds categories, translations, and the initial menu
└── vercel.json       Routes /api and /public to the backend, everything else to the frontend
```

## Local development

Requires Node.js 22+.

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev             # nodemon, http://localhost:5000
```

Without `DATABASE_URL` set, the backend falls back to a local JSON file (`data_fallback.json`, gitignored) so you can run it without a real Postgres instance — this fallback is for local development only and is never used once `DATABASE_URL` is configured.

**Frontend:**
```bash
cd frontend
npm install
npm start                # ng serve, http://localhost:4200
```

`proxy.conf.json` forwards `/api` and `/public` requests to the backend on port 5000 during local development, matching how `vercel.json` routes them in production.

**Seeding the database** (only needed against a real Postgres instance):
```bash
cd backend
node seed.js
```

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Production | Neon Postgres connection string. Without it, the backend uses the local JSON fallback. |
| `JWT_SECRET` | Recommended | Signs admin auth tokens. If unset, a random one is generated per process — fine for local dev, not for production (sessions won't survive a restart). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Recommended | Admin login credentials, seeded into `admin_users`. |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob token for menu/design image uploads. |

## Deployment

Deployed on Vercel with:
- **Neon** for Postgres (via the Vercel Marketplace integration)
- **Vercel Blob** for uploaded images (menu photos, design assets)

```bash
vercel deploy --prod
```

The backend uses `@neondatabase/serverless` rather than the standard `pg` driver — Neon's serverless compute suspends when idle, and a plain TCP pool doesn't reliably survive that cold-start wake-up within a serverless function's short lifetime.
