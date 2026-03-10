# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NestJS 11 server for Buster. Handles Excel file ingestion, entity parsing, data validation, and conflict detection for a robot manufacturing factory analysis tool.

## Tech Stack
- NestJS 11 / Node.js 20 / TypeScript (strict mode)
- PostgreSQL via **Neon** (serverless) — connection string in `.env` as `DATABASE_URL`
- **TypeORM** — `synchronize: true` in non-production (auto-creates/alters tables on startup)
- npm

## Commands
```bash
npm run start:dev    # Watch mode (hot reload)
npm run start        # Start once
npm run build        # Compile to dist/
npm run lint         # ESLint with auto-fix
```

## Architecture

### Module structure
Each feature lives in `src/modules/<feature>/` and owns:
- `<feature>.module.ts` — registers TypeORM entity + exports service
- `<feature>.controller.ts` — routing only, no business logic
- `<feature>.service.ts` — business logic, injected repository
- `entities/<feature>.entity.ts` — TypeORM entity

Shared abstractions live in `src/shared/`.

### BaseEntity pattern
Two base entities in `src/shared/entities/`:

- **`BaseEntity`** — used by all entities except Conflict. `id` is a user-provided string (`@PrimaryColumn`), set from the uploaded Excel data.
- **`GeneratedBaseEntity`** — used only by `ConflictEntity`. `id` is auto-generated (`@PrimaryGeneratedColumn('increment')`). No `source` field.

`BaseEntity` also provides:
- `source` — `jsonb`, array of `{ column, value }` pairs from the uploaded Excel row

Both provide:
- `createdAt`, `updatedAt`, `deletedAt` — TypeORM-managed (soft delete via `deletedAt`)

### Entity column order convention
Because TypeORM puts parent-class columns first, the DB column order is always:
`id → source → createdAt → updatedAt → deletedAt → [entity-specific columns]`

### Relations
Use `@OneToOne` / `@ManyToOne` with `@JoinColumn({ name: 'foreignKeyColumn' })` on the owning side.
Use `@RelationId` to expose the FK value as a typed property without a redundant `@Column`.
Always add the inverse side (`@OneToOne(() => X, (x) => x.y)`) on the related entity.

## Domain Entities
| Entity | Table | Notes |
|--------|-------|-------|
| `BatteryEntity` | `batteries` | sku, batteryType, batteryVersion, lithiumVersion |
| `PlasticEntity` | `plastics` | plasticType, FK → batteries (1:1) |
| Robot, Sensor, Wiring, Communication, Storage, Iron, Cardboard, Sale, Conflict | pending | |

## Conventions
- **Strict TypeScript**: no `any`, explicit types everywhere
- **Explicit access modifiers**: `public`, `private`, or `protected` on every class member
- **Private members**: `_` prefix
- **Booleans**: `is` prefix
- **Constants**: UPPER_SNAKE_CASE in `consts/` folders
- **`type` over `interface`**
- **No `for`/`while`/`let`**: use `map`, `filter`, `forEach`, `reduce`
- **Always brace `if` statements**
- **File names**: lowercase kebab-case

## Prettier
`semi: true`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 120`, `tabWidth: 2`, `arrowParens: "always"`
