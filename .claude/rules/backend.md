# Backend Rules — `apps/api` (NestJS 10 + TypeORM + PostgreSQL)

Stack: NestJS **10** (Express platform) · TypeORM **0.3** · PostgreSQL ·
Passport (JWT + local) · class-validator / class-transformer · Swagger · Jest.

> This project uses **TypeORM**, not Prisma, and **Express**, not Fastify.
> Do not introduce a second ORM or HTTP adapter.

---

## Project Structure

```
apps/api/src/
├── main.ts                     # Bootstrap: global prefix `api`, ValidationPipe, JwtGuard, Swagger
├── app/
│   ├── app.module.ts           # Root module: ConfigModule, TypeOrmModule, feature modules
│   ├── app.controller.ts
│   └── app.service.ts
├── decorators/                 # @Public(), @User()
├── dto/                        # Cross-module DTOs (create-user, update-user)
├── entities/                   # TypeORM entities: user, cycle, measurement
└── modules/
    ├── auth/                   # Login, register, JWT + local strategies, JwtGuard
    ├── users/                  # User lookup / persistence
    ├── measurement/            # Basal temperature measurements
    └── cycle/                  # Cycles
```

### Feature module layout

```
modules/measurement/
├── measurement.module.ts       # Module definition
├── measurement.controller.ts   # Route handlers (thin)
├── measurement.service.ts      # Business logic + repository access
└── measurement.controller.spec.ts
```

Auth additionally has `guards/`, `strategy/`, `dto/`, and `types/` subfolders — follow that
shape when a module grows those concerns.

---

## NestJS

- One module per domain feature, registered in `AppModule`
- Controllers handle HTTP concerns only (params, status codes, headers) — no business logic
- Services own business logic, validation, and data access
- **Constructor injection** on the backend (unlike the Angular app, which uses `inject()`)
- Register entities per module with `TypeOrmModule.forFeature([Measurement])`
- Export a service from its module only when another module actually needs it
- Use `@Global()` sparingly — only for genuinely global infrastructure (Config)
- Global prefix is `api` (`app.setGlobalPrefix('api')`) — route paths must not repeat it
- Apply `@UseGuards()` / `@UseInterceptors()` / `@UsePipes()` at controller or method level
- Swagger is served at `/api/docs`; document DTOs and entities with `@ApiProperty()`
- Read configuration through `ConfigService` — never `process.env` directly in services

## File Naming (Backend)

- NestJS convention with suffixes: `measurement.controller.ts`, `measurement.service.ts`,
  `measurement.module.ts`
- DTOs: `create-measurement.dto.ts`, `update-measurement.dto.ts`, `login-response.dto.ts`
- Guards: `jwt.guard.ts` · Strategies: `jwt.strategy.ts` · Entities: `measurement.entity.ts`
- One class per file — no barrel exports

---

## DTOs & Validation

- `class-validator` decorators on **every** DTO field (`@IsString()`, `@IsInt()`,
  `@IsOptional()`, `@IsUUID()`, …) — an endpoint without a validated DTO is a bug
- `class-transformer` (`@Exclude()` / `@Expose()`) for response shaping
- The global `ValidationPipe` in `main.ts` runs with
  `whitelist: true, forbidNonWhitelisted: true, transform: true` — keep it that way
- Separate request DTOs (Create/Update) from response DTOs
- `PartialType()` / `PickType()` from `@nestjs/swagger` to avoid duplication
- DTOs shared with the frontend live in `libs/shared/model`
  (`@basal-temp-log-workspace/model`); backend-only request DTOs stay in `apps/api`

```typescript
export class CreateMeasurementDto {
  @ApiProperty({ example: 36.6 })
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
```

---

## Entities & Database

- TypeORM entities in `apps/api/src/entities`, one per file, named `*.entity.ts`
- `@PrimaryGeneratedColumn('uuid')` for primary keys — sequential IDs leak information
- Always give columns an explicit `type` and length where it matters
- Always specify `onDelete` on relations — don't let the database guess
- Add `@CreateDateColumn()` / `@UpdateDateColumn()` to new entities
- Add indexes on foreign keys and frequently queried columns
- Model every entity explicitly — no `json` columns for core domain data
  (freeform, optional metadata only)
- Repository access goes through services — no repository injection into controllers
- No raw SQL unless the query builder genuinely cannot express it; when unavoidable,
  use parameterized queries

```typescript
@Entity({ name: 'measurement' })
export class Measurement {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'float' })
  temperature: number;

  @ManyToOne(() => Cycle, (cycle) => cycle.measurements, { onDelete: 'CASCADE' })
  cycle: Cycle;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Migrations

`synchronize: true` can silently drop columns and lose data. It is acceptable **only**
during early local development.

```typescript
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DB_HOST'),
    // ...
    synchronize: config.get('NODE_ENV') === 'development',
    // Migrations run as a deploy step (`nx run api:migration-run`), not while booting.
    migrationsRun: false,
  }),
  inject: [ConfigService],
});
```

- Set up migrations **before** the first production deployment
- Every schema change is a migration file — no exceptions
- Test migrations in both directions (up and down)

---

## Services

- One service per domain: `AuthService`, `UsersService`, `MeasurementService`, `CycleService`
- Inject repositories via `@InjectRepository(Entity)`
- Return DTOs or plain objects — never leak raw entities with password hashes to controllers
- Handle business validation in services ("does this cycle belong to this user?")
- Throw NestJS exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`,
  `UnauthorizedException`
- Every query on user-owned data must be scoped by the authenticated user's id —
  never trust an id from the request body alone

---

## Authentication & Authorization

- `JwtGuard` is registered globally via `APP_GUARD` in `AppModule` (and in `main.ts`) —
  **secure by default**
- Opt specific routes out with the `@Public()` decorator (`decorators/public.decorator.ts`)
- `@User()` param decorator extracts the authenticated user from the request
- Passport strategies live in `modules/auth/strategy/` (`jwt.strategy.ts`, `local.strategy.ts`)
- Passwords hashed with bcrypt — never stored or logged in plaintext
- JWT secret and expiry come from `ConfigService`, never hardcoded
- There is no role system in this app; every user owns only their own data.
  Do not add role decorators until roles actually exist in the `User` entity.

---

## Error Handling

- Use NestJS built-in exceptions rather than returning error objects
- Register a global `AllExceptionsFilter` for a consistent error shape:
  `{ statusCode, message, error }`
- Log with the NestJS `Logger` (with context) — never `console.log()`
- Never expose stack traces, SQL, or internal paths in production responses

---

## Testing (Backend)

- **Jest** (`nx test api`) — this workspace does not use Vitest
- Unit-test services with a mocked repository (`getRepositoryToken(Entity)`)
- Test controllers with `Test.createTestingModule()` from `@nestjs/testing`
- `apps/api-e2e` runs Jest against a built API — cover auth flow and CRUD critical paths
- Seed test data in `beforeEach`, clean up in `afterEach`

---

## Anti-Patterns (Never Do)

| Don't | Do Instead |
|-------|-----------|
| Business logic in controllers | Extract to services |
| Raw entities in responses | Map to response DTOs |
| `any` in DTOs/services | class-validator decorators + explicit types |
| Unvalidated request body/params | A validated DTO on every endpoint |
| `console.log()` | NestJS `Logger` |
| `process.env` in services | `ConfigService` |
| `synchronize: true` in production | TypeORM migrations |
| Trusting a user id from the request body | Derive it from the JWT via `@User()` |
| `@Injectable({ scope: Scope.REQUEST })` | Default singleton scope unless truly needed |
| Circular module dependencies | Restructure; `forwardRef()` only as a last resort |
| Barrel exports from modules | Import specific files |

---

## Known Deviations in This Repo

Everything previously listed here was fixed by `api-contract-hardening`: migrations replaced
unconditional `synchronize`, the duplicate `JwtGuard` registration and the scaffold comment are
gone, `AllExceptionsFilter` gives every error one shape, `mysql2` is dropped, and
`Measurement.cycle` declares `onDelete: 'CASCADE'`.

What remains:

- `AuthService.getMe` and `MeasurementService.toResponse` strip fields by destructuring, which
  trips `@typescript-eslint/no-unused-vars` as a warning. Harmless, and the rule is not disabled.
- **There are no migration files yet, deliberately.** Nothing is deployed, the local data is
  disposable, and the entities are still changing. Local development and the e2e suite build the
  schema with `synchronize`; `apps/api/src/migrations/` is empty and `migration-run` is a no-op.
  Generate the first one before the first deployment:
  `nx run api:migration-generate --name=initial-schema` against an empty database.
- Migrations are an **explicit deploy step**, never `migrationsRun` at boot — two instances
  starting at once would race on them. The app does not load migrations at all; only the CLI
  data source (`src/database/data-source.ts`) does, which is why an ordinary glob works there.
