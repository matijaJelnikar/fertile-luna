# Security Rules

Context: this app stores **health data** — basal body temperature, cycle dates, fertility
signs. Under GDPR that is special-category data (Art. 9). Treat every record as sensitive
personal data, not as ordinary app content.

---

## General (Frontend & Backend)

- NEVER commit `.env`, API keys, JWT secrets, or database credentials to git
  (`apps/api/.env` is gitignored — keep it that way)
- NEVER use `eval()` or the `Function()` constructor
- NEVER disable an eslint rule without explicit approval
- Always validate and sanitize user input at system boundaries
- Use parameterized queries / the TypeORM query builder — never interpolate user input into SQL
- Keep dependencies patched; do not add a dependency to solve a two-line problem

## Frontend

- NEVER use `innerHTML` or bypass Angular's sanitizer (`bypassSecurityTrust*`)
- NEVER manipulate the DOM directly (`document.getElementById`, `document.body.classList`) —
  use bindings, the `host` object, or an injectable service
- Always use Angular's `HttpClient` — never `fetch()` or `XMLHttpRequest`
- Never log tokens, passwords, or health measurements to the console
- Nothing sensitive in URLs or query params

## Backend

- NEVER ship `synchronize: true` to production — use migrations
- NEVER expose stack traces, SQL, or internal paths in production error responses
- NEVER return the password hash on a user object — exclude it in the query or the response DTO
- Every endpoint requires a validated DTO; the global `ValidationPipe` keeps
  `whitelist: true, forbidNonWhitelisted: true`
- Scope every data query by the authenticated user id from the JWT — never by an id taken
  from the request body or params alone. Broken object-level authorization is the most likely
  real vulnerability in this codebase.
- Rate-limit public endpoints (`@nestjs/throttler`, the Express-compatible option) —
  login and register especially
- CORS with an explicit origin whitelist — never `origin: '*'` in production
- Log security events (failed auth, permission denied) with request context, never with credentials

## Authentication

- `JwtGuard` is global (`APP_GUARD`); routes are protected by default and opt out
  explicitly via `@Public()`. Never invert this.
- Hash passwords with bcrypt — never store or log plaintext
- Short-lived access tokens; add refresh-token rotation before a public launch
- Do not lengthen token lifetime as a workaround for a refresh bug

### Token storage — known risk in this app

The mobile client stores the JWT in `localStorage` and sends it as a `Bearer` header. Any XSS
gives an attacker the token. httpOnly + secure + SameSite cookies are the safer default for a
browser-delivered app and are the preferred direction for this codebase.

If localStorage stays (installed-PWA constraints):
- Enforce a strict Content-Security-Policy header
- Keep access tokens short-lived and add refresh-token rotation
- Hold the access token in a signal in memory; persist only the refresh token
- Clear all stored credentials on logout and on 401

## Data Protection (GDPR)

- Health and cycle data is special-category data — collect the minimum needed and never
  send it to third-party analytics
- Provide a data export endpoint (Art. 20) and a full account+data deletion endpoint (Art. 17);
  deletion must cascade to cycles and measurements
- HTTPS everywhere; no health data over plain HTTP
- Do not add third-party trackers, CDNs, or scripts that receive user data
