# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Buster — Monorepo Root

## What the App Does
Buster is a **data aggregation and conflict-resolution platform** for robot manufacturing production lines. Data about robots and their components is collected from multiple external sources (CRM, ERP, WMS, manual exports, etc.) and uploaded as Excel files. The system merges this data into a single unified view and detects **field-level conflicts** — cases where the same field on the same entity has different values coming from different sources.

The core goal is to produce a **Single Source of Truth**: users review each conflict, see the competing values and their origins, and decide which value is correct. Once all conflicts are resolved, the data is considered authoritative.

## User Flow
1. **Upload** — user uploads an Excel file (fixed template per entity type). The server forwards it to the Python parser service, which extracts structured entity data and returns it.
2. **Merge & conflict detection** — the server compares incoming data against existing DB records. Any field where the new value differs from the stored value generates a `Conflict` record.
3. **Conflict resolution** — users see conflict cards showing the old value + source vs. new value + source, and pick the winner. Resolved conflicts are marked `isSolved`.
4. **View** — the home page shows a merged table of all robot data across all related entities. Users can filter, sort, and toggle which columns are visible. Open conflicts are visually highlighted.
5. **Export** — users can export the current data to Excel.

## Excel Upload Model
- A user uploads an Excel for a **single entity type** (e.g., just robots) or a **parent entity that embeds child entities** (e.g., a robot Excel that also includes sensor and wiring rows).
- Each Excel follows a fixed template. Users can download the correct template from the upload page.
- The Python parser (`app/parser`) handles all CSV parsing logic and returns structured JSON to the server.
- CSV templates for each entity type live in `app/parser/templates/`.

## Entities
| Entity | Description |
|--------|-------------|
| `Robot` | The main manufactured unit being analyzed |
| `Sensor` | Sensor components attached to a robot |
| `Wiring` | Wiring components |
| `Communication` | Communication modules |
| `Battery` | Battery components |
| `Storage` | Storage components |
| `Iron` | Raw material — iron |
| `Plastic` | Raw material — plastic |
| `Cardboard` | Raw material — cardboard |
| `Sale` | Sale/order records |
| `Conflict` | Detected data conflicts / validation issues |

## Repository
GitLab: `git@gitlab.com:ori.gritzman/buster.git`

## Monorepo Structure
```
app/
├── client/     # Angular 19 client (not yet initialized)
├── server/     # NestJS 11 API server  ← active
└── parser/     # Python FastAPI CSV parsing service  ← active
```

Each sub-project has its own `CLAUDE.md` with tech-specific conventions. **Read `app/server/CLAUDE.md` before working in the server.**

## Server Commands (from `app/server/`)
```bash
npm run start:dev    # Watch mode (hot reload)
npm run start        # Start once
npm run build        # Compile to dist/
npm run lint         # ESLint with auto-fix
npm run test         # Integration tests (sequential, --runInBand, 60s timeout)
npx jest entities.integration --runInBand   # Run the single integration spec directly
```

The server reads two env vars from `.env`:
- `DATABASE_URL` — Neon PostgreSQL connection string (TypeORM `synchronize: true` in non-production)
- `PARSER_URL` — Python parser service URL (e.g. `http://localhost:8000`)

Tests live in `src/tests/` and use a real database via the full `AppModule`.

Uploaded files are saved to `<repo-root>/files/` (outside `app/`).

## Parser Commands (from `app/parser/`)
```bash
pip install -r requirements.txt    # Install dependencies
uvicorn main:app --reload          # Dev mode with hot reload
uvicorn main:app                   # Start once (default port 8000)
```

**Endpoint**: `POST /parse` — body: `{ "path": "<absolute path to .csv file>" }` — returns `ParsedRow[]`.

The parser reads the CSV from disk (the server saves the upload to `<repo-root>/files/` first, then sends the path). It builds a `RobotHierarchy` per CSV row via `assembler.py`, then flattens it to a dict via `helpers/flatten.py`. CSV templates for manual use are in `app/parser/templates/`; test fixture CSVs are in `app/parser/tests/`.

## Sub-project Status
| Project | Tech | Status |
|---------|------|--------|
| `app/server` | NestJS 11 + PostgreSQL (Neon) + TypeORM | Active — all entities, data-processor, and conflict resolution implemented |
| `app/parser` | Python FastAPI + uvicorn | Active — CSV parsing + hierarchy flattening implemented |
| `app/client` | Angular 19 | Pending |

## Server Architecture Summary
The server has three key abstractions in `src/shared/`:
- **`BaseRepository`** — generic CRUD + soft delete. No `save`/`update` by design: existing entity fields are never overwritten directly; conflicting data creates a `ConflictEntity` instead.
- **`BaseService`** — wraps the repository; tracks which Excel file each field value came from via a `source` jsonb column, and user-provided notes via a `notes` jsonb column (same shape). Both are maintained per-column on insert and gap-fill updates. Subclasses must declare `tableName`.
- **`EntityServiceRegistry`** — service locator that maps `tableName → BaseService`. Used by `DataProcessorService` and `ConflictResolverService` to dispatch to the right service at runtime without per-entity branching.

The **`DataProcessorModule`** (`src/modules/data-processor/`) orchestrates ingestion: receives `ParsedRow[]`, enriches missing UUIDs, maps each row to typed entity data, then processes each entity leaf-first (`Battery → … → Robot`). For new entities: `insert`; for existing: `ConflictService.detectConflicts()` → bulk-insert `ConflictEntity` records, then `update` for null gap-fills.

The **`ConflictModule`** (`src/modules/conflict/`) handles resolution via `PATCH /api/conflicts/resolve` (body: `{ tableName, entityId, columnName, winnerValue, conflictResolver, resolutionNotes }`). `ConflictResolverService` validates the winner value, applies it to the entity (or its referenced FK entity), and marks the entire conflict group `isSolved`.

See `app/server/CLAUDE.md` for the full entity relationship chain, column conventions, TypeORM patterns, and conflict resolution details.

## Cross-project Conventions (from UIAI)
- **Private members**: prefix with `_`
- **Booleans**: prefix with `is`
- **Constants**: UPPER_SNAKE_CASE in `consts/` folders
- **No magic numbers / hardcoded strings**
- **`type` over `interface`**
- **File names**: lowercase kebab-case
- **Explicit access modifiers** on all class members
- **No `for`/`while` loops**: use `map`, `filter`, `forEach`, `reduce`
- **Always brace `if` statements**
- **SOLID**: Single Responsibility, Dependency Inversion, DRY
