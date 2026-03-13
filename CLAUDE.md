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
- The Python parser (`app/service`) handles all Excel parsing logic and returns structured JSON to the server.

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
└── service/    # Python Excel processing service (not yet initialized)
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
- `PARSER_URL` — Python parser service URL

Tests live in `src/tests/` and use a real database via the full `AppModule`.

Uploaded files are saved to `<repo-root>/files/` (outside `app/`).

## Sub-project Status
| Project | Tech | Status |
|---------|------|--------|
| `app/server` | NestJS 11 + PostgreSQL (Neon) + TypeORM | Active — all entities + data-processor implemented |
| `app/client` | Angular 19 | Pending |
| `app/service` | Python (TBD) | Pending |

## Server Architecture Summary
The server has two key abstractions in `src/shared/`:
- **`BaseRepository`** — generic CRUD + soft delete. No `save`/`update` by design: existing entity fields are never overwritten directly; conflicting data creates a `ConflictEntity` instead.
- **`BaseService`** — wraps the repository and handles `source` field tracking (which Excel file each field value came from).

The **`DataProcessorModule`** (`src/modules/data-processor/`) orchestrates ingestion: it receives `ParsedRow[]` from the Python parser, maps each row to typed entity data, then for each entity either inserts (new) or runs `ConflictService.detectConflicts()` (existing). Detected conflicts are bulk-inserted as `ConflictEntity` records; non-conflicting field updates are applied via `BaseService.update()`.

See `app/server/CLAUDE.md` for the full entity relationship chain, column conventions, and TypeORM patterns.

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
