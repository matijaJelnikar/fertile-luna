# BasalTempLog

A PWA for tracking basal body temperature and menstrual cycles. Log a daily
temperature, and the app derives cycle day, detects the post-ovulation
temperature shift, and charts the cycle.

Nx monorepo: Angular 19 PWA + NestJS 10 API + PostgreSQL.

```
apps/mobile   # Angular 19 PWA (Material 19, Chart.js, ngx-translate)
apps/api      # NestJS 10 API (TypeORM, Passport JWT, Swagger)
apps/api-e2e  # Jest API e2e tests
libs/shared   # model (DTOs/types) + components (reusable UI)
```

Domain: a **user** has **cycles**, and each cycle has daily **measurements**.
Cycle length, end date, and the temperature shift are derived, not stored.

> Health data — basal temperature and cycle dates are special-category data
> under GDPR. See `.claude/rules/security.md`.

## Setup

```sh
npm install
```

Create `apps/api/.env` (gitignored):

```
JWT_SECRET=
ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USERNAME=
DB_PASSWORD=
```

## Development

```sh
npm run start:all            # api + mobile in parallel
npx nx serve mobile          # dev server, proxies /api via proxy.conf.json
npx nx serve api             # API on :3000, Swagger at /api/docs
npx nx test mobile|api       # Jest
npx nx lint mobile|api       # ESLint (module boundaries enforced)
npx nx build mobile --configuration=production
```

## Deployment

`docker-compose.yml` runs Postgres, the API, the built frontend, and an nginx
proxy on `:80`. Environment variables come from a root `.env`.

```sh
docker compose up --build
```

## Conventions

Rules live in `.claude/` — `CLAUDE.md` for the stack overview, and
`rules/coding.md`, `rules/backend.md`, `rules/security.md` for the details.
Each rule file lists known deviations in the current code.
