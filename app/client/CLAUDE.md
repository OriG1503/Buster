# CLAUDE.md — app/client

Angular 19 client for Buster (data aggregation & conflict-resolution platform).

## Tech Stack
- Angular 19
- Node.js 20, npm 10
- PrimeNG 19 with **Aura** preset theme (dark mode via `.dark-mode` class on `<html>`, managed by `ThemeService` with localStorage persistence)
- SCSS for styling

## Commands
```bash
npm start        # Start dev server (http://localhost:4200)
npm run build    # Production build
npm run watch    # Incremental dev build (watch mode)
npm test         # Run unit tests with Karma
```

## Folder Structure
```
src/app/
├── core/           # Singleton services, guards, interceptors, app-wide utilities
│   ├── services/       # App-wide services
│   └── routes/         # View components for routes
├── features/       # Feature modules (lazy-loaded), each owns its own atomic design layers
│   └── <feature>/
│       ├── atoms/          # Feature-specific basic UI elements
│       ├── molecules/      # Feature-specific combinations of atoms
│       ├── organisms/      # Business logic components
│       ├── types/          # Feature-specific types (each type in its own file)
│       ├── consts/         # Feature-specific constants
│       └── mapping/        # Feature-specific translation maps (*.label-map.ts)
├── shared/         # Only truly cross-feature items (used by 2+ features)
│   ├── atoms/      # Global basic UI elements
│   ├── molecules/  # Global combinations of atoms
│   ├── types/      # Cross-feature types
│   ├── consts/     # Cross-feature constants
│   ├── mapping/    # Cross-feature translations
│   └── pipes/      # Cross-feature pipes
```

## Atomic Design (Component Architecture)
- **Atoms** — Basic UI elements (buttons, inputs, icons); no logic, purely presentational
- **Molecules** — Combinations of atoms; minimal logic if needed
- **Organisms** — Live in `features/` only; contain most of the business logic

## Conventions
- Use standalone components (Angular 19 default)
- **Signals for inputs/outputs**: Use `input()` and `output()` for component communication
- SCSS for component styling
- **Direct imports**: Always import from the specific file path — no index.ts barrels
- No spec/test files (`.spec.ts`)
- Prettier: `semi: true`, `arrowParens: always`, `useTabs: false`, `bracketSpacing: true`, `printWidth: 120`, `singleQuote: true`, `trailingComma: "all"`, `tabWidth: 2`, `singleAttributePerLine: true`
- Each type in its own file in the owning feature's `types/` (or `shared/types/` if used by 2+ features)
- Prefer `type` over `interface`
- **Every component must have 3 separate files**: `.ts`, `.html`, `.scss` (even if empty)
- **No inline templates/styles**: Always use `templateUrl` and `styleUrl`

## SCSS Rules
- **Mirror HTML hierarchy**: SCSS nesting must match HTML structure
- **No global styles**: Avoid adding to `styles.scss`; use component styles instead (exception: CSS variables and scrollbar appearance)
- **No `!important`**: Use `ViewEncapsulation.None` at component level for PrimeNG overrides

## Naming Conventions
- Private members: `_` prefix
- Signals: `$` prefix (e.g., `$count`); private signals: `_$` prefix
- Booleans: `is` prefix
- Constants: UPPER_SNAKE_CASE in `consts/` folders
- File names: lowercase kebab-case
- CSS classes: lowercase kebab-case, no IDs
- Translation files: `*.label-map.ts` in `mapping/` folders

## Code Style
- **Explicit access modifiers**: Every class member must have `public`, `private`, or `protected`
- No `let`, `for`, `while` — use `forEach`, `map`, `filter`, etc.
- **Always brace `if` statements**
- Clickable elements must use `<button>` (not divs/spans)
- Navigation links must use `<a>`

## CSS Units
- `vh` — only for top-level/root elements
- `%` — for all nested elements
- `rem` — for font sizes, margin, padding

## Color Palette (CSS Variables)
| Color | Hex | Variable |
|-------|-----|----------|
| Red | `#e74b3b` | `--color-red` |
| Light Gray | `#efefef` | `--color-light-gray` |
| Navy Gray | `#bfc4cd` | `--color-navy-gray` |
| White Soft | `#f9fafc` | `--color-white-soft` |
| Dark Navy | `#03153a` | `--color-dark-navy` |
| White | `#ffffff` | `--color-white` |
| Blue | `#3f70e3` | `--color-blue` |
| Orange | `#ffb656` | `--color-orange` |
| Yellow | `#ffee80` | `--color-yellow` |
| Option Hover | `rgba(63,112,227,0.1)` | `--color-option-hover` |
| Option Selected | `rgba(231,75,59,0.18)` | `--color-option-selected` |

## Angular Signals Pattern
- `signal()` for local component state
- `computed()` for derived state
- `effect()` for reactive side effects
- Input signals: `$input = input<Type>(defaultValue)`
- Output signals: `outputName = output<Type>()`
