# BasalTempLog — Project Instructions

You are an expert in TypeScript, Angular, and NestJS. You write functional, maintainable,
performant, and accessible code following the conventions in this repo.

## Stack (do not drift from it)

| Area | Choice |
|------|--------|
| Runtime | Node 26 |
| Monorepo | Nx 23 |
| Frontend | Angular **22**, Angular Material 22 (M3), SCSS, ngx-translate 18, SVG charts, PWA |
| Backend | NestJS 11 on Express 5, TypeORM 0.3, PostgreSQL, Passport JWT, Swagger |
| Shared | `libs/shared/model` (DTOs/types), `libs/shared/components` (UI) |
| Tests | Jest 30 (unit + `apps/api-e2e`) |
| Language | TypeScript 6.0 (not 7 — Angular 22 needs `<6.1`) |

Angular is on **v22**. The app still runs with zone.js (`provideZoneChangeDetection`).
NestJS stays on 11 until `@nx/nest` supports 12.
The backend uses **TypeORM + Express** — never Prisma, never Fastify.

```
apps/mobile   # Angular PWA      apps/api     # NestJS API
apps/api-e2e  # Jest API e2e     libs/shared  # model + components
```

Path aliases: `@basal-temp-log-workspace/model`, `@basal-temp-log-workspace/components`.

## Detailed Rules

Read the rule file that covers what you're touching:

- **`.claude/rules/coding.md`** — shared TS style, naming, and all Angular frontend rules
  (components, templates, signals, routing, HTTP, forms, styling, i18n, testing)
- **`.claude/rules/backend.md`** — NestJS modules, DTOs, TypeORM entities, migrations, auth, testing
- **`.claude/rules/security.md`** — secrets, input validation, authz, token storage, GDPR/health data

Each rule file ends with a **Known Deviations** section listing current code that breaks the
rules. Don't copy those patterns; migrate them when you touch the surrounding code.

## Non-Negotiables

### TypeScript
- Strict type checking; prefer inference when the type is obvious
- Avoid `any` — use `unknown` when the type is uncertain

### Angular
- Standalone components; never set `standalone: true` (it's the default) or `false`
- `ChangeDetectionStrategy.OnPush` on every component — if it breaks under OnPush, it's a bug
- `inject()` over constructor injection (frontend); NestJS keeps constructor injection
- `input()` / `output()` / `model()` functions — never `@Input()` / `@Output()` decorators
- `host` object in the decorator — never `@HostBinding` / `@HostListener`
- Native control flow `@if` / `@for` (with `track`) / `@switch` — never `*ngIf` / `*ngFor` / `*ngSwitch`
- `[class.x]` / `[style.x]` bindings — never `ngClass` / `ngStyle`
- No arrow functions, `new Date()`, or function calls in templates — logic goes in `computed()`
- Lazy-load feature routes; functional guards and interceptors only
- Signal Forms for new forms; existing typed reactive forms stay until touched
- `NgOptimizedImage` for static images (not for inline base64)
- Import individual Material components — never a `MaterialModule` barrel

### State
- Signals for local and shared state; `computed()` for derived; `linkedSignal()` for writable derived
- Never `mutate` a signal — use `set()` / `update()`; expose services' state as `asReadonly()`
- `effect()` is for side effects only — **never** `.subscribe()` inside an `effect()`
  (use `resource()` / `rxResource()`, or `toObservable()` + `switchMap()` + `takeUntilDestroyed()`)

### Backend
- Thin controllers, business logic in services, a validated DTO on every endpoint
- Routes are protected by default (`JwtGuard` via `APP_GUARD`); opt out with `@Public()`
- Scope every query by the authenticated user — never trust an id from the request body
- `ConfigService`, not `process.env`; NestJS `Logger`, not `console.log`

### Accessibility
- MUST pass all AXE checks
- MUST meet WCAG AA minimums: focus management, color contrast, ARIA attributes
- No hardcoded user-facing strings — use ngx-translate keys

## Commands

```bash
npm run start:all            # serve api + mobile in parallel
npx nx serve mobile          # Angular dev server (proxies /api via proxy.conf.json)
npx nx serve api             # NestJS API on :3000, Swagger at /api/docs
npx nx test mobile|api       # Jest
npx nx lint mobile|api       # ESLint (module boundaries enforced)
npx nx build mobile --configuration=production
```
