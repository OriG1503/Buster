# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Buster — Monorepo Root

## What the App Does
Buster is a **robot manufacturing factory analysis tool**. Users upload Excel files containing data about factory entities (robots, parts, materials, etc.). The app ingests, parses, and analyzes the data to verify that robots and their components are correct and complete — flagging fields with missing or invalid data.

## Excel Upload Model
- A user can upload an Excel for a **single entity** (e.g., just robots).
- A user can upload an Excel for a **parent entity that contains child entities** (e.g., a robot Excel that also includes its sensors and wiring).
- The app maps Excel columns to the correct entity fields and validates the data.

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

Each sub-project has its own `CLAUDE.md` with tech-specific conventions.

## Sub-project Status
| Project | Tech | Status |
|---------|------|--------|
| `app/server` | NestJS 11 + PostgreSQL (Neon) + TypeORM | Active — all entities defined |
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
