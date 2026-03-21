# Buster — Server

NestJS 11 API server for the Buster data aggregation platform.

## Setup

```bash
npm install
```

Create a `.env` file in `app/server/`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
PARSER_URL=http://localhost:8999
FILES_URL=http://localhost:<port>
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `PARSER_URL` | URL of the Python parser service |
| `FILES_URL` | Base URL where uploaded files are served from |

## Commands

```bash
npm run start:dev    # Dev mode with hot reload
npm run start        # Start once
npm run build        # Compile to dist/
npm run lint         # ESLint with auto-fix
npm run test         # Integration tests (real DB, sequential)
```
