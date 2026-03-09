# CLAUDE.md — Server

NestJS 11 server for Buster. Handles Excel file ingestion, entity parsing, data validation, and conflict detection for a robot manufacturing factory analysis tool.

## Tech Stack
- NestJS 11
- Node.js 20
- TypeScript (strict mode)
- PostgreSQL via **Neon** (serverless Postgres)
- **TypeORM** for database access
- npm

## Commands
```bash
npm run start        # Start dev server
npm run start:dev    # Watch mode (hot reload)
npm run start:prod   # Production
npm run build        # Compile to dist/
npm run lint         # ESLint
```

## Domain — Entities
| Entity | Notes |
|--------|-------|
| `Robot` | Main manufactured unit |
| `Sensor` | Sensor component, child of Robot |
| `Wiring` | Wiring component, child of Robot |
| `Communication` | Communication module, child of Robot |
| `Battery` | Battery component, child of Robot |
| `Storage` | Storage component |
| `Iron` | Raw material |
| `Plastic` | Raw material |
| `Cardboard` | Raw material |
| `Sale` | Sale / order record |
| `Conflict` | Detected data conflict / validation issue |

Parent entities can contain child entities in the same Excel upload. The server must detect and split them correctly.

## Folder Structure
```
src/
├── main.ts                  # Bootstrap
├── app.module.ts            # Root module
├── core/                    # App-wide singletons (guards, interceptors, filters, pipes)
├── modules/                 # Feature modules, each owns its own controllers/services/types
│   └── <feature>/
│       ├── <feature>.module.ts
│       ├── <feature>.controller.ts
│       ├── <feature>.service.ts
│       ├── entities/        # TypeORM entities
│       ├── types/           # Feature-specific types (one type per file)
│       └── consts/          # Feature-specific constants
└── shared/                  # Utilities used by 2+ modules
    └── types/               # Cross-module types
```

## Conventions
- **Strict TypeScript**: All members must have explicit types; no `any`
- **Explicit access modifiers**: Every class member must have `public`, `private`, or `protected`
- **Private members**: prefix with `_` (e.g., `_privateVar`)
- **Booleans**: prefix with `is` (e.g., `isActive`)
- **Constants**: UPPER_SNAKE_CASE, defined in `consts/` folders
- **No magic numbers / hardcoded strings**: All constants in `consts/` files
- **`type` over `interface`**: Prefer `type` for all type definitions
- **No `let`, `for`, `while`**: Use `map`, `filter`, `forEach`, `reduce`
- **Always use braces `{}`** for `if` statements — never single-line without braces
- **File names**: lowercase kebab-case (e.g., `file-upload.controller.ts`)

## SOLID Principles
- **Single Responsibility**: Each controller/service has one clear purpose
- **Dependency Inversion**: Depend on abstractions (types) not concrete implementations
- **DRY**: Extract shared logic into `shared/` or `core/`

## Prettier Config
`semi: true`, `arrowParens: always`, `useTabs: false`, `bracketSpacing: true`, `printWidth: 120`, `singleQuote: true`, `trailingComma: "all"`, `tabWidth: 2`

## NestJS Patterns
- Use constructor injection (NestJS DI)
- Controllers handle routing only — business logic lives in services
- Use DTOs for request/response shapes
- Global prefix: `/api`

## Database
- **Neon** serverless PostgreSQL
- **TypeORM** with decorators
- Each entity has its own TypeORM entity class in its module's `entities/` folder
- Migrations over `synchronize: true` in production
