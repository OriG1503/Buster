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
- `<feature>.module.ts` — registers TypeORM entity, provides and exports both repository and service
- `<feature>.service.ts` — business logic; injects the custom repository (not `InjectRepository` directly)
- `<feature>.repository.ts` — custom repository extending `BaseRepository`
- `entities/<feature>.entity.ts` — TypeORM entity

Shared abstractions live in `src/shared/`.

### Repository layer
`src/shared/repositories/base.repository.ts` — abstract `BaseRepository<T, TId>` with `findAll`, `findById`, `insert`, `insertMany`, `update`, `softDelete`.

**Important**: `update` is only called for **gap-fills** (stored field is `null`, incoming has a value). Existing non-null fields are never overwritten directly — differing values create a `ConflictEntity` instead.

`insert`, `insertMany`, and `update` all call `_resolveRelationIdFields()` which transforms `@RelationId` properties (e.g. `batteryId`) into relation objects (`{ battery: { id } }`) before passing to TypeORM — `@RelationId` is a read-only virtual property and TypeORM silently ignores it on writes without this transformation.

Each module's repository extends it:
```ts
@Injectable()
export class RobotRepository extends BaseRepository<RobotEntity> {
  public constructor(@InjectRepository(RobotEntity) repository: Repository<RobotEntity>) {
    super(repository);
  }
}
```

The module registers it as a provider and the service receives it via constructor injection:
```ts
// robot.module.ts
providers: [RobotRepository, RobotService],
exports: [RobotRepository, RobotService],

// robot.service.ts
public constructor(private readonly _repository: RobotRepository) {}
```

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

All entities extend `BaseEntity` (user-provided string `id`, `source` jsonb) except `ConflictEntity` which extends `GeneratedBaseEntity` (auto-increment `id`, no `source`).

| Entity | Table | Key columns | Relations (owning side holds FK) |
|--------|-------|-------------|----------------------------------|
| `RobotEntity` | `robots` | — | OneToOne → Cardboard, Sensor, Communication, Sale; ManyToOne → Wiring |
| `WiringEntity` | `wirings` | wiringType, district, municipality | OneToOne → Storage; OneToMany ← Robot |
| `StorageEntity` | `storages` | storageType, storageVersion, isStockNetanya, isStockAfula | OneToOne ← Wiring |
| `SensorEntity` | `sensors` | sensorType, sensorVersion | OneToOne ← Robot |
| `CommunicationEntity` | `communications` | communicationType | OneToOne → Plastic, Iron; OneToOne ← Robot |
| `PlasticEntity` | `plastics` | plasticType | OneToOne → Battery; OneToOne ← Communication |
| `BatteryEntity` | `batteries` | sku, batteryType, batteryVersion, lithiumVersion | OneToOne ← Plastic |
| `IronEntity` | `irons` | ironType, ironVersion, isHeatConductor | OneToOne ← Communication |
| `CardboardEntity` | `cardboards` | cardboardType, cardboardVersion | OneToOne ← Robot |
| `SaleEntity` | `sales` | carrier, onlineStoreName, salesperson, isPurchased, isStockAshdod, isStockTelAviv, isStockRehovot, notes, dataSource | OneToOne ← Robot |
| `ConflictEntity` | `conflicts` | tableName, columnName, entityId, newValue, newSource, oldValue, oldSource, conflictCreator, conflictResolver, isSolved, notes | standalone |

### Entity relationship chain
```
Sale ←── Robot ──→ Cardboard
              ├──→ Sensor
              ├──→ Communication ──→ Plastic ──→ Battery
              │                 └──→ Iron
              └──→ Wiring ──→ Storage
```

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
