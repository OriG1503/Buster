# CLAUDE.md — Buster (Monorepo Root)

File loading and combining app — ingests Excel/CSV files and helps users find and merge the right columns/rows.

## Repository
GitLab: `git@gitlab.com:ori.gritzman/buster.git`

## Monorepo Structure
```
app/
├── client/     # Angular 19 client (not yet initialized)
├── server/     # NestJS 11 API server  ← active
└── service/    # Python Excel processing service (not yet initialized)
```

Each sub-project has its own `CLAUDE.md` with tech-specific conventions.

## Sub-project Status
| Project | Tech | Status |
|---------|------|--------|
| `app/server` | NestJS 11 | Initialized |
| `app/client` | Angular 19 | Pending |
| `app/service` | Python (TBD) | Pending |

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
