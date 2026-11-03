# Coding Rules — Frontend (`apps/mobile`) & Shared Code

Stack: Nx 23 monorepo · Angular **22** · Angular Material **22** (M3) ·
ngx-translate 18 · SVG charts · PWA/service worker · Jest 30 · TypeScript 6.0 · Node 26.

> The app still runs with zone.js; going zoneless is a separate, deliberate change.

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
- Don't put verbose comments to the code, the code should be self explanatory. When it's not you can add a short comment

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
- Keep the suffix convention already used across this repo:
  `*.component.ts`, `*.service.ts`, `*.guard.ts`, `*.interceptor.ts`, `*.entity.ts`, `*.dto.ts`
  (the suffix-less style guide does **not** apply here — consistency wins)
- Co-locate specs: `foo.component.spec.ts` next to `foo.component.ts`

---

## Workspace Layout

```
apps/
  mobile/      # Angular 22 PWA
  api/         # NestJS 11 backend
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

| Folder              | Contents                                                                          |
| ------------------- | --------------------------------------------------------------------------------- |
| `views/`            | Routed feature components (`home`, `history`, `settings`) + their services        |
| `components/`       | App-level shared components (`shell`, `add-measurement`, `new-cycle`)             |
| `auth/`             | Authentication + credentials services, guard, login/registration/complete-profile |
| `state/`            | Signal-based domain state services (`user`, `measurements`, `fertility`)          |
| `services/`         | Cross-cutting infra services (`local-storage`)                                    |
| `interceptors/`     | HTTP interceptors                                                                 |
| `shared/constants/` | Endpoint and common constants                                                     |

- Group by domain/feature, not by technical type; structure mirrors routing.
- Truly reusable, app-agnostic UI belongs in `libs/shared/components`, not `app/components`.

---

## Components

- Standalone components only — **never** set `standalone: true` (it is the default)
  and never set `standalone: false`
- `ChangeDetectionStrategy.OnPush` on **every** component (the v22 default; never `Eager`). If a component breaks under
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
} @else { @for (item of items(); track item.id) {
<app-card [data]="item" />
} @empty {
<p>{{ 'items.empty' | translate }}</p>
} }
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

  readonly selected = computed(() => this.items().find((i) => i.id === this.selectedId()) ?? null);

  addItem(dto: CreateItemDto) {
    return this.http.post<Item>(API.items.create, dto).pipe(tap((item) => this.state.update((list) => [item, ...list])));
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
  params: () => this.selectedId(),
  loader: ({ params: id }) =>
    id ? firstValueFrom(this.detailService.load(id)) : Promise.resolve(null),
});

// GOOD — rxResource() for Observable loaders
details = rxResource({
  params: () => this.selectedId(),
  stream: ({ params: id }) => this.detailService.load(id),
});

// GOOD — explicit RxJS pipeline
private selectedId$ = toObservable(this.selectedId);
constructor() {
  this.selectedId$
    .pipe(filter(Boolean), switchMap((id) => this.detailService.load(id)), takeUntilDestroyed())
    .subscribe();
}
```

For plain HTTP reads, `httpResource()` is simpler than `resource()` + `firstValueFrom()`.

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

**Signal Forms** for new forms (see below). Existing reactive forms stay valid — migrate them
when you touch them. Never template-driven forms.

Rules for the reactive forms that remain:

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

### Signal Forms

`form()` + a signal model + the `[formField]` directive, from `@angular/forms/signals`.

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
- Submit through `<form [formRoot]="myForm">` plus a `submission.action` in `form()` options;
  `submitting()` replaces a hand-rolled loading flag
- Text inputs need a `string` model (`''` for empty): a `null` model makes a text input parse as a number
- A field whose value becomes `undefined` disappears from the field tree, so a CVA that writes
  `undefined` (a single-select `mat-chip-listbox` on deselect) breaks the form — use
  `app-chip-choice` (`components/chip-choice`), which maps it to `null`
- `mat-step` takes `[completed]="myForm().valid()"` instead of `[stepControl]`

All app forms are Signal Forms; do not add new reactive forms.

---

## Error Handling

- Global `ErrorHandler`: `{ provide: ErrorHandler, useClass: GlobalErrorHandler }` in `app.config.ts`
- A `NotificationService` wrapping `MatSnackBar` for all user-facing success/error feedback
- HTTP errors handled centrally in the error interceptor (401 → logout, 5xx → generic message)
- Never swallow errors — always log

---

## Styling & Theming

- Angular Material 22 (M3) via `mat.theme()` in `styles.scss`
- Import individual Material components (`MatButton`, `MatIcon`) — **never** a `MaterialModule` barrel;
  a barrel defeats tree-shaking and pulls in components you don't use
- Theme colors centralized in `src/styles/_theme-colors.scss`
- Prefer M3 system tokens (`var(--mat-sys-surface)`, `var(--mat-sys-on-surface)`) over hardcoded colors

### Tailwind CSS 4

- Configured in `apps/mobile/src/tailwind.css`, built through `apps/mobile/.postcssrc.json`
- **Utilities in templates** for layout, spacing and typography on plain elements:
  `class="flex flex-col gap-2 text-sm"`; `:host` styles go in the `host` object as `class`
- **No preflight** — its reset breaks Material components
- **Colors are M3 tokens only**: the default palette is cleared, so `bg-surface`, `text-primary`,
  `border-outline-variant`, `text-on-surface-variant` map to `--mat-sys-*` and follow dark mode.
  Add an app color as a CSS variable in `styles.scss` and map it in `@theme inline`
- Utilities live in a CSS layer, so Material's unlayered styles win over them. Size or reshape a
  Material element (`mat-icon` size **and color**, `mat-toolbar`, `mat-*-button` font) in component SCSS,
  not with utilities
- Two utilities for the same property have no reliable order — toggle the pair
  (`[class.text-primary]="active" [class.text-on-surface]="!active"`), never stack them
- No `@apply` in component styles: each use copies Tailwind's `@property` boilerplate into the
  component and blows the 2 KB budget. Repeat utilities, or extract a component
- Component SCSS stays for what utilities can't express well: keyframes, SVG chart styling,
  Material overrides
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

| Don't                                                 | Do Instead                                            |
| ----------------------------------------------------- | ----------------------------------------------------- |
| `MaterialModule` barrel                               | Import individual Material components                 |
| `@Input()` / `@Output()`                              | `input()` / `output()` functions                      |
| `@HostBinding` / `@HostListener`                      | `host` object in `@Component`                         |
| Class-based `HttpInterceptor`                         | Functional `HttpInterceptorFn` + `withInterceptors()` |
| Class-based `CanActivate` guard                       | Functional `CanActivateFn`                            |
| `*ngIf` / `*ngFor` / `*ngSwitch`                      | `@if` / `@for` / `@switch`                            |
| `ngClass` / `ngStyle`                                 | `[class.*]` / `[style.*]` bindings                    |
| Constructor injection                                 | `inject()` function                                   |
| `.subscribe()` inside `effect()`                      | `resource()` / `rxResource()`                         |
| `ChangeDetectorRef` / `setTimeout()` to force refresh | Fix the root cause                                    |
| Endpoint enums                                        | `as const` object                                     |
| Hardcoded UI strings                                  | ngx-translate keys                                    |
| `any` type                                            | Proper types or `unknown`                             |

---

## Known Deviations in This Repo

Current code that violates the rules above. Do not copy these patterns; migrate them
when touching the surrounding code.

- No global `ErrorHandler` and no `NotificationService` yet
- No `environments/` files — API URL is not configurable per environment
- Initial bundle (~1.15 MB) and `home.component.scss` exceed their warning budgets
