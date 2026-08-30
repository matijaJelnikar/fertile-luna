# Coding Rules — Frontend (`apps/mobile`) & Shared Code

Stack: Nx 20 monorepo · Angular **19.1** · Angular Material **19** (M3) ·
ngx-translate · Chart.js · PWA/service worker · Jest.

> Angular version matters. This repo is on **v19** — APIs from v20/v21
> (Signal Forms, `httpResource()`, zoneless bootstrap) are **not available**.
> Do not write code against them.
>
> **A v21 upgrade is planned.** Rules for v21-only APIs are kept in this file as
> commented-out blocks marked `PARKED until the Angular 21 upgrade` — uncomment them
> as part of that upgrade rather than rewriting them from scratch.

---

## Shared Code Style (Frontend & Backend)

### Naming
- PascalCase for classes, enums, types, interfaces
- camelCase for variables and methods
- No `I` prefix on interfaces: `User` not `IUser`
- Plural names for collections: `users` not `userList`
- Methods start with verbs: `getUser()`, `isValid()`, `hasPermission()`

### General
- `const` by default, `let` when needed, never `var`
- Single quotes for strings (matches `.prettierrc`)
- Arrow functions over anonymous functions
- Comments explain WHY, not HOW
- TODO/FIXME comments must include a reason: `// TODO: reason`

### Typing
- Type everything — avoid `any`, use `unknown` if the type is uncertain
- Use interfaces for structural types, not classes
- Union types over generic strings: `'active' | 'inactive'` not `string`
- Leverage type inference for primitives
- Types/DTOs shared between `mobile` and `api` live in `libs/shared/model` and are
  imported as `@basal-temp-log-workspace/model` — that lib is the single source of
  truth for the API contract

### File Naming
- Kebab-case: `add-measurement.component.ts`, `auth.interceptor.ts`
- Keep the Angular v19 suffix convention already used across this repo:
  `*.component.ts`, `*.service.ts`, `*.guard.ts`, `*.interceptor.ts`, `*.entity.ts`, `*.dto.ts`
  (the suffix-less v20 style guide does **not** apply here — consistency wins)
- Co-locate specs: `foo.component.spec.ts` next to `foo.component.ts`

---

## Workspace Layout

```
apps/
  mobile/      # Angular 19 PWA
  api/         # NestJS 10 backend
  api-e2e/     # Jest-based API e2e
libs/shared/
  model/       # @basal-temp-log-workspace/model — DTOs, types, enums, constants
  components/  # @basal-temp-log-workspace/components — reusable UI (fab, temperatures-chart)
```

- Only two path aliases exist: `@basal-temp-log-workspace/model` and
  `@basal-temp-log-workspace/components`. Do not invent `@core/*`, `@shared/*`, `@features/*`.
- Do not create a new lib unless it is used by more than one app.
- `@nx/enforce-module-boundaries` is on — respect it.

### `apps/mobile/src/app` structure

| Folder | Contents |
|--------|----------|
| `views/` | Routed feature components (`home`, `history`, `settings`) + their services |
| `components/` | App-level shared components (`shell`, `add-measurement`, `new-cycle`) |
| `auth/` | Authentication + credentials services, guard, login/registration/complete-profile |
| `state/` | Signal-based domain state services (`user`, `measurements`, `fertility`) |
| `services/` | Cross-cutting infra services (`local-storage`) |
| `interceptors/` | HTTP interceptors |
| `shared/constants/` | Endpoint and common constants |

- Group by domain/feature, not by technical type; structure mirrors routing.
- Truly reusable, app-agnostic UI belongs in `libs/shared/components`, not `app/components`.

---

## Components

- Standalone components only — **never** set `standalone: true` (it is the default in v19)
  and never set `standalone: false`
- `ChangeDetectionStrategy.OnPush` on **every** component. If a component breaks under
  OnPush, the component has a bug — fix the root cause, never `ChangeDetectorRef` or `setTimeout`
- Separate files for class (`.ts`), template (`.html`), and styles (`.scss`);
  inline templates are fine for genuinely tiny components
- Use `inject()`, not constructor injection
- Prefix selectors with `app-`; match the class name: `AddMeasurementComponent` → `app-add-measurement`
- Signal-based `input()`, `output()`, `model()` — never `@Input()` / `@Output()` decorators
- `input.required<Type>()` for mandatory inputs
- Minimize lifecycle hooks — prefer `computed()`, `effect()`, `linkedSignal()`
- Self-closing tags for components without content: `<app-fab />`
- Never use `@HostBinding` / `@HostListener` — use the `host` object in `@Component`
- Import only what a component needs — never a barrel module

```typescript
@Component({
  selector: 'app-example',
  imports: [MatButton, MatIcon],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'example',
    '[class.is-active]': 'isActive()',
    '(click)': 'onClick($event)',
  },
})
export class ExampleComponent {
  private router = inject(Router);

  label = input<string>('');
  data = input.required<number[]>();
  saved = output<void>();

  count = signal(0);
  doubled = computed(() => this.count() * 2);
}
```

---

## Templates

- Native control flow `@if` / `@for` / `@switch` — never `*ngIf`, `*ngFor`, `ngSwitch`
- `@for` must `track item.id` (never `track $index` for dynamic data); use `@empty`
- Property binding over interpolation: `[title]="name()"` not `title="{{ name() }}"`
- `[class.active]="condition()"` — never `ngClass`
- `[style.width.px]="width()"` — never `ngStyle`
- No function calls in templates (signal reads are fine); use `@let` for local aliases
- Never put arrow functions or `new Date()` in templates — unsupported / re-evaluated every cycle
- Semantic HTML over generic divs; keep templates declarative — logic goes in `computed()`
- Use the async pipe for observables
- `NgOptimizedImage` for static images (does not work for inline base64)

```html
@if (isLoading()) {
  <mat-spinner />
} @else {
  @for (item of items(); track item.id) {
    <app-card [data]="item" />
  } @empty {
    <p>{{ 'items.empty' | translate }}</p>
  }
}
```

---

## Reactivity & State

- `signal()` for writable state, `computed()` for derived, `linkedSignal()` for writable derived
- `effect()` only for side effects (localStorage, DOM sync) — avoid writing signals in effects
- Never mutate signal contents — use `set()` / `update()` (there is no `mutate`)
- RxJS for event streams, HTTP calls, debounce/throttle; `toSignal()` to bridge into signals
- `takeUntilDestroyed()` for subscription cleanup
- Prefer `signal()` over `BehaviorSubject` for state
- Keep state as local as possible. Progression:
  component state → `input()`/`output()` → service with signals in `state/` → (only if truly
  needed) a store library. No NgRx in this project.
- Expose readonly signals from services:
  `private state = signal(...)` + `readonly items = this.state.asReadonly()`

```typescript
@Injectable({ providedIn: 'root' })
export class ItemsService {
  private http = inject(HttpClient);

  private state = signal<Item[]>([]);
  readonly items = this.state.asReadonly();
  readonly selectedId = signal<string | null>(null);

  readonly selected = computed(
    () => this.items().find((i) => i.id === this.selectedId()) ?? null
  );

  addItem(dto: CreateItemDto) {
    return this.http
      .post<Item>(API.items.create, dto)
      .pipe(tap((item) => this.state.update((list) => [item, ...list])));
  }
}
```

### CRITICAL: `effect()` + `subscribe()` = memory leak

Never call `.subscribe()` inside `effect()`. Every re-run creates a new subscription and
the previous one is never torn down.

```typescript
// BAD
effect(() => {
  const id = this.selectedId();
  if (id) this.detailService.load(id).subscribe(); // LEAK
});

// GOOD — resource() (already used by UserService)
details = resource({
  request: () => this.selectedId(),
  loader: ({ request: id }) =>
    id ? firstValueFrom(this.detailService.load(id)) : Promise.resolve(null),
});

// GOOD — rxResource() for Observable loaders
details = rxResource({
  request: () => this.selectedId(),
  loader: ({ request: id }) => this.detailService.load(id),
});

// GOOD — explicit RxJS pipeline
private selectedId$ = toObservable(this.selectedId);
constructor() {
  this.selectedId$
    .pipe(filter(Boolean), switchMap((id) => this.detailService.load(id)), takeUntilDestroyed())
    .subscribe();
}
```

`resource()` / `rxResource()` are **experimental** in v19 — fine to use (the repo already
does), but expect API churn on upgrade.

---

## Routing

- Lazy-load every feature route with `loadComponent`; `loadChildren` for multi-route features
- `ShellComponent` hosts the authenticated layout — put the guard on the Shell, not on each child
- Functional guards only (`CanActivateFn`) — no class-based `CanActivate`
- `routerLink` in templates; reserve `router.navigate()` for programmatic redirects
- `withComponentInputBinding()` for route params; resolvers for required data
- Wildcard `**` route last

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const credentials = inject(CredentialsService);
  const router = inject(Router);
  if (credentials.isAuthenticated) return true;
  router.navigate(['/login'], { queryParams: { redirect: state.url } });
  return false;
};
```

---

## HTTP & API Layer

- Angular `HttpClient` exclusively — never `fetch()` or `XMLHttpRequest`
- Type every call: `this.http.get<Measurement[]>(API.measurement.list)`
- Minimize requests; parallelize with `forkJoin()` instead of chaining sequentially
- Functional interceptors (`HttpInterceptorFn`) registered via
  `provideHttpClient(withInterceptors([...]))` — no class-based `HttpInterceptor`
- Endpoint constants as a plain `as const` object, not enums — it supports nesting and
  parameterized URLs, which enums cannot

```typescript
export const API = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/user/me',
  },
  measurement: {
    list: '/api/measurement/getAll',
    create: '/api/measurement/add',
    byId: (id: string) => `/api/measurement/${id}`,
  },
} as const;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(CredentialsService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthenticationService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      } else if (error.status >= 500) {
        notification.error('Something went wrong. Please try again.');
      }
      return throwError(() => error);
    })
  );
};
```

Dev requests are proxied to the API through `apps/mobile/proxy.conf.json`.

---

## Forms

**Reactive forms only** on v19. Template-driven forms don't scale and are hard to test.
(Signal Forms are Angular 21 — see the parked block at the end of this section.)

- Type the `FormGroup` with an interface
- `nonNullable: true` for fields that must never reset to null
- `getRawValue()` for fully typed access including disabled controls
- Show errors only once a control is `touched` and `invalid`
- Validate on the frontend for UX; the backend validates for security — never trust the client

```typescript
interface MeasurementForm {
  temperature: FormControl<number | null>;
  note: FormControl<string>;
}

form = new FormGroup<MeasurementForm>({
  temperature: new FormControl(null, [Validators.required, Validators.min(30)]),
  note: new FormControl('', { nonNullable: true }),
});
```

### Signal Forms — PARKED until the Angular 21 upgrade

Commented out on purpose: these APIs do not exist on v19. Uncomment this block, and drop
the "Reactive forms only" wording above, once the workspace is on Angular 21.

<!--
Signal Forms are the modern approach for new code on Angular 21+.
They use `form()` + a signal model + the `[formField]` directive.
Note: still experimental; the API may change.

- Define the data model as a `signal<T>({...})`
- Create the field tree with `form(model, schema?)` — the second arg is the validation schema
- Bind inputs with `[formField]="myForm.fieldName"` (import `FormField`)
- Read field state: `myForm.field().value()`, `.valid()`, `.touched()`, `.dirty()`, `.errors()`, `.pending()`
- Update programmatically: `myForm.field().value.set(newValue)`
- Validation via the schema function:
  - Built ins: `required()`, `email()`, `min()`, `max()`, `minLength()`, `maxLength()`, `pattern()`
  - Custom sync: `validate(path, ({ value, valueOf }) => errorObj | null)`
  - Custom async: `validateHttp(path, { request, onSuccess, onError })`
  - Cross field: use `valueOf(otherPath)` inside `validate()` — reactive automatically,
    no manual `updateValueAndValidity()`
  - Array items: `applyEach(path, itemSchema)`
  - Standard Schema (Zod/Valibot): `validateStandardSchema(path, zodSchema)`
- Wrap reusable validators in functions so they can be shared across forms
- Show errors only when `touched()` and `invalid()`

Existing reactive forms stay valid — migrate them opportunistically, not in a big bang.
-->

---

## Error Handling

- Global `ErrorHandler`: `{ provide: ErrorHandler, useClass: GlobalErrorHandler }` in `app.config.ts`
- A `NotificationService` wrapping `MatSnackBar` for all user-facing success/error feedback
- HTTP errors handled centrally in the error interceptor (401 → logout, 5xx → generic message)
- Never swallow errors — always log

---

## Styling & Theming

- Angular Material 19 (M3) via `mat.theme()` in `styles.scss`
- Import individual Material components (`MatButton`, `MatIcon`) — **never** a `MaterialModule` barrel;
  a barrel defeats tree-shaking and pulls in components you don't use
- SCSS for component styles; theme colors centralized in `src/styles/_theme-colors.scss`
- Prefer M3 system tokens (`var(--mat-sys-surface)`, `var(--mat-sys-on-surface)`) over hardcoded colors
- Dark mode belongs in an injectable `ThemeService` (signal + `LocalStorageService` +
  `prefers-color-scheme`) — never scatter `document.body.classList` calls across components
- Respect the configured budgets: initial 500 KB warn / 2 MB error, component styles 2 KB / 4 KB

---

## Internationalization

- ngx-translate; translation files in `apps/mobile/public/i18n/<lang>.json`
- Templates: `{{ 'home.greeting' | translate }}`
- TypeScript: `translateService.instant('key')` (synchronous, only after init)
- Organize keys by feature: `home.*`, `settings.*`
- No hardcoded user-facing strings in templates or components

---

## Accessibility

- Must pass AXE checks and WCAG AA minimums: focus management, color contrast, ARIA attributes
- Semantic elements and labels on every form control; charts need text alternatives

---

## Testing (Frontend)

- Jest via Nx (`nx test mobile`); specs co-located as `*.spec.ts`
- Test behavior, not implementation — assert rendered output and emitted outputs,
  not that a signal was called
- Services: business logic, signal transformations, HTTP calls with a mocked `HttpClient`
- Components: rendering from inputs, user interaction, output emission
- Guards/interceptors: redirects, token attachment, error handling
- Do not test framework behavior (e.g. "does OnPush work?")
- Follow the existing `*.service.mock.ts` pattern in `auth/` for shared test doubles

---

## Anti-Patterns (Never Do)

| Don't | Do Instead |
|-------|-----------|
| `MaterialModule` barrel | Import individual Material components |
| `@Input()` / `@Output()` | `input()` / `output()` functions |
| `@HostBinding` / `@HostListener` | `host` object in `@Component` |
| Class-based `HttpInterceptor` | Functional `HttpInterceptorFn` + `withInterceptors()` |
| Class-based `CanActivate` guard | Functional `CanActivateFn` |
| `*ngIf` / `*ngFor` / `*ngSwitch` | `@if` / `@for` / `@switch` |
| `ngClass` / `ngStyle` | `[class.*]` / `[style.*]` bindings |
| Constructor injection | `inject()` function |
| `.subscribe()` inside `effect()` | `resource()` / `rxResource()` |
| `ChangeDetectorRef` / `setTimeout()` to force refresh | Fix the root cause |
| Endpoint enums | `as const` object |
| Hardcoded UI strings | ngx-translate keys |
| `any` type | Proper types or `unknown` |

---

## Known Deviations in This Repo

Current code that violates the rules above. Do not copy these patterns; migrate them
when touching the surrounding code.

- `apps/mobile/src/app/material.module.ts` — Material barrel module; replace with direct imports
- `apps/mobile/src/app/interceptors/auth.interceptor.ts` — class-based interceptor registered via
  `HTTP_INTERCEPTORS`; convert to `HttpInterceptorFn` + `withInterceptors()`
- `apps/mobile/src/app/shared/constants/endpoints.constants.ts` — endpoint enums; convert to `as const`
- No global `ErrorHandler` and no `NotificationService` yet
- No `environments/` files — API URL is not configurable per environment
- Dark mode / `ThemeService` not implemented; `styles.scss` is hardcoded to `theme-type: light`
