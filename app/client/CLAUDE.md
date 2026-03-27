# CLAUDE.md — app/client

Angular 19 client for Buster (data aggregation & conflict-resolution platform).

## App Layout

### Routes
- `/` → **Home Page** (entity data table)
- `/conflicts` → **Conflicts Page** (conflict resolution)
- Popups (modals/dialogs) layered on top of both pages for specific actions

---

### Home Page (`/`)
The main content is a **dynamic data table** populated by querying the server.

**Entity switcher** — user can switch between any entity table:
- Available entities: Robot, Sensor, Wiring, Communication, Battery, Storage, Iron, Plastic, Cardboard, Sale
- The Conflict entity is **excluded** from this page
- Default columns shown = all native properties of the selected entity

**Column manager** — user can add/remove columns from the table:
- Each entity's own properties are always available
- If an entity has FK relationships to other entities, the **child entity's properties** are also available to add as columns
  - Example: Plastic has a FK to Battery → Battery properties (type, etc.) can optionally be displayed in the Plastic table
  - Example: Battery has no FKs → only Battery's own properties are available
- This drives what columns appear in the column selector UI

**Per-column filtering** — each displayed column has a plain-string search/filter input

**Cell value coloring** — text color indicates conflict status:
| Color | Meaning |
|-------|---------|
| White (default) | Value is clean — no conflict |
| Red | Open conflict exists on this field |
| Green | Conflict was resolved |

**Cell click behavior:**
- **Red cell** → navigates to the Conflicts Page, pre-focused/filtered on the referenced conflict
- **Green cell** → opens the **Resolved Conflict History** popup

**Resolved Conflict History popup** ("היסטוריית קונפליקט מוכרע") (green cell click):

Header:
- Title + **X** close button + **pencil/edit icon** (triggers revert)

History table (one row per source entry):
| Column | Description |
|--------|-------------|
| מקור (Source) | Data source name |
| תאריך יצירה (Created) | Date the value was recorded |
| ערך (Value) | The actual field value |
| הגדרה (Status) | e.g. תקין (current/winner), דנה ישן (outdated), לא מוגדר (undefined) |

- The winning row is marked with a filled blue dot; others have empty dots

Metadata section (below table):
- **שם מחליט** — name of the user who resolved the conflict
- **תאריך הכרעה** — date resolved
- **הערות** — resolution notes (e.g. "הכרעה בוצעה לאחר בדיקה בשטח")

Footer:
- **"אישור"** (Confirm) button — blue, bottom left

**Table UX:**
- **Horizontal scrolling** when columns overflow the viewport
- **Pagination** — server-side, because the dataset can be large
- Record count shown above the table on the left (e.g. "נמצאו: 124 תוצאות")

**Action bar** (above table, right-aligned):
- **ניהול עמודות** — column manager button
- **ייצוא לאקסל** — export to Excel button
- **+ בחר טבלה** — entity switcher button

**Visual design:**
- Dark theme throughout
- Each column header has a search/filter input directly beneath it
- Navbar: logo centered ("BUSTER"), navigation links on the right

---

### Conflicts Page (`/conflicts`)
Shows all **open (unresolved) conflicts** with pagination.

Conflicts are displayed as **collapsible boxes**, one per conflicted entity.

**Collapsed state (summary):**
- Entity ID
- Table name
- Which columns have conflicts (list/count)

**Expanded state (full detail):**
- The full entity data from the DB
- All conflicting fields shown with their competing values (old value + source vs. new value + source)
- User can select the winning value per field

**Resolve section** (bottom of expanded box):
- Resolution notes input
- Any other resolution metadata fields
- **OK / Confirm** button — submits the resolution, marks the conflict as solved

**Navigation from Home Page:** clicking a red cell on the Home Page navigates here with the relevant conflict box pre-opened/highlighted.

---

### Upload Popup ("העלאת נתונים חדשים")
A modal dialog for uploading Excel files.

**Header:**
- Title + subtitle instruction text
- **"הורדת קבלות"** (Download Templates) button — top right of modal
- **X** close button — top left

**Drag & drop zone:**
- Dashed border, cloud upload icon
- "גרור ושחרר את הקובץ" label with a clickable browse link

**File result rows** (appear below the drop zone after each upload, one row per file):
- **Green checkmark** — success (0 conflicts, 100%)
- **Yellow/orange warning triangle** — partial success (conflicts detected, shows conflict count + info icon)
- Each row shows: filename, status icon, progress percentage, conflict/entity count, optional link

**Footer:**
- **"אישור"** (Confirm) button — blue, bottom left

## Tech Stack
- Angular 19
- Node.js 20.10.0, npm 10.9.2
- PrimeNG 19 with **Aura** preset theme — **dark mode only** (`.dark-mode` class is permanently on `<html>`, no light mode, no theme toggle)
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
