# Buster Logger Service

This document describes the **LoggerService** that lives in both the server (`app/server/src/shared/services/logger/`) and the parser (`app/parser/shared/`). It is the single way both services emit structured logs.

## Goals

- Produce **machine-readable JSON logs** in a uniform shape across all Buster components.
- Use the **ECS** (Elastic Common Schema) field convention so logs can be ingested into the same pipeline (Elasticsearch, Datadog, Loki, etc.) and queried side-by-side.
- Give callers a tiny, predictable API: pass a **message** and a **logContext**; the service fills in everything else.
- Allow searching logs by `logContext` to separate **business workflow** logs (`app-workflow`) from **infrastructure / health** logs (`app-monitoring`).

## ECS Payload Shape

Every log line is a single JSON object with the following fields:

| Field         | Type     | Source                | Description                                                             |
| ------------- | -------- | --------------------- | ----------------------------------------------------------------------- |
| `project`     | `string` | predefined (constant) | Always `"buster"`.                                                      |
| `component`   | `string` | predefined (constant) | `"server"` for the NestJS API, `"parser"` for the Python service.       |
| `environment` | `string` | predefined (env var)  | `process.env.NODE_ENV` / `PYTHON_ENV` (defaults to `"development"`).    |
| `message`     | `string` | caller                | Human-readable description of the event.                                |
| `user`        | `object` | predefined            | The user the log is attributed to (default: the system service user).   |
| `logContext`  | `string` | caller                | One of `"app-workflow"` or `"app-monitoring"` (caller picks per-call).  |

In addition, the underlying logger (Winston / Python `logging`) prepends:

| Field       | Type     | Description                                        |
| ----------- | -------- | -------------------------------------------------- |
| `timestamp` | `string` | ISO-8601 UTC timestamp.                            |
| `level`     | `string` | `info` / `warn` / `error` / `debug` / `verbose`.   |

### `user` object

The `user` field is the only non-string property in the ECS payload. It is an object with:

```json
{ "email": "system@buster.local", "name": "system", "role": "system" }
```

The default value is the **system user** (declared in `consts/logger.const.ts` on the server and `_DEFAULT_USER` on the parser). Per requirements, `project`, `component`, `environment`, and `user` are **predefined inside the service** — callers do not pass them.

## Log Levels

Five level methods are exposed (Winston-style names). All accept `(message: string, logContext: LogContext)`:

| Method      | Level     | Typical use                                                         |
| ----------- | --------- | ------------------------------------------------------------------- |
| `log()`     | `info`    | Alias for `info()`. Default-severity workflow events.               |
| `info()`    | `info`    | "Something happened" — service entry, completion, branch decisions. |
| `warn()`    | `warn`    | Recoverable problems: validation rejection, conflict detection, retried fetch. |
| `error()`   | `error`   | Failures the service caught: HTTP 5xx, parser failure, FK violation. |
| `debug()`   | `debug`   | Internal state useful only when chasing a bug.                      |
| `verbose()` | `verbose` | Highly granular trace logs (Python maps this to `debug`).           |

## Log Context

Each call MUST specify one of:

- **`"app-workflow"`** — describes what the user/system did and what business logic ran. This is the context used everywhere the logger is currently called from. These logs answer "what did the backend do for this request?"
- **`"app-monitoring"`** — reserved for infra/health/metrics-style logs (heartbeats, periodic counters, dependency probes). Currently no call sites use it; keep it available for future telemetry instrumentation.

## API — Server (TypeScript / NestJS)

`app/server/src/shared/services/logger/logger.service.ts`

```ts
import { LoggerService } from 'src/shared/services/logger/logger.service';

@Injectable()
export class MyService {
  public constructor(private readonly _logger: LoggerService) {}

  public async run(): Promise<void> {
    this._logger.info('MyService.run — started', 'app-workflow');
    try {
      const result = await this._doWork();
      this._logger.info(`MyService.run — finished with ${result.count} items`, 'app-workflow');
    } catch (err) {
      this._logger.error(`MyService.run — failed: ${(err as Error).message}`, 'app-workflow');
      throw err;
    }
  }
}
```

The `LoggerModule` is registered as `@Global()` and imported once in `AppModule`, so any service/controller/middleware can inject `LoggerService` directly.

### Files added

- `logger.service.ts` — Winston-backed service exposing `log/info/warn/error/debug/verbose`.
- `logger.module.ts` — `@Global()` NestJS module that exports `LoggerService`.
- `types/log-context.type.ts` — `'app-monitoring' | 'app-workflow'` literal union.
- `types/log-user.type.ts` — `{ email, name, role }`.
- `types/ecs-log-payload.type.ts` — full ECS payload shape.
- `consts/logger.const.ts` — `LOGGER_PROJECT`, `LOGGER_COMPONENT`, `LOGGER_DEFAULT_USER`.

### Dependencies

- Adds `winston` (`^3.18`) to `app/server/package.json`.

### Wiring

- `AppModule` imports `LoggerModule` and registers `LoggingMiddleware` for `*` routes.
- `GlobalExceptionFilter` is registered through DI (`providers: [GlobalExceptionFilter]` + `app.useGlobalFilters(app.get(GlobalExceptionFilter))` in `main.ts`) so it can receive an injected `LoggerService`.

## API — Parser (Python / FastAPI)

`app/parser/shared/logger_service.py`

```python
from shared.logger_service import logger_service

logger_service.info('parse_excel — started', 'app-workflow')
logger_service.warn('parse_excel — non-CSV path rejected', 'app-workflow')
logger_service.error(f'parse_excel — failed: {exc}', 'app-workflow')
logger_service.debug('flatten_hierarchy — flattening RobotHierarchy', 'app-workflow')
```

A module-level singleton `logger_service` is exposed for convenience. Internally it uses Python's stdlib `logging` with a custom JSON formatter that emits the same ECS payload as Winston.

### Files added

- `app/parser/shared/__init__.py` — package marker.
- `app/parser/shared/logger_service.py` — `LoggerService` class + `logger_service` singleton + ECS JSON formatter.

### Wiring

- `app/parser/main.py` replaces the previous stdlib `basicConfig` with `logger_service`. The HTTP middleware now logs request-received / response-sent through it.
- `app/parser/routers/parse.py`, `app/parser/assembler.py`, and `app/parser/helpers/flatten.py` import `logger_service` and emit workflow logs throughout the parsing pipeline.

## Where logs are emitted

The intent of this rollout is that **every code path with logic** (services, middleware, guards, exception filters, controllers that do non-trivial work) emits at least one `app-workflow` log entry describing what it did and the inputs/outcomes. Below is a non-exhaustive map of where logs were added.

### Server

- `LoggingMiddleware` — request-received / response-sent (HTTP method, path, status, duration).
- `GlobalExceptionFilter` / `AllExceptionsFilter` — every unhandled / HTTP exception.
- `JwtAuthGuard` / `RolesGuard` — accept / reject decisions, with handler name and role.
- `AuthService` / `AuthController` — login flow, role derivation.
- `FileController` / `FileService` — upload start, header translation, parser dispatch, processing summary, report generation, download.
- `S3Service` — every download / upload / delete (including the no-bucket path).
- `DataProcessorService` / `EntityIngestionService` / `EntityInsertService` / `EntityUpdateService` — per-row entry, branch decisions (insert / stub / update), gap-fill summaries, unique-violation handling.
- `ParsedRowEnricher` — fictive UUID assignment for plastic / communication / wiring intermediates.
- `FkConflictService` — TWO_FATHERS and TWO_CHILDS detection; fictive replacement decisions.
- `ValueConflictService` / `ValueConflictResolverService` / `RevertService` (both copies) — detected conflict counts, gap-fill counts, resolution / revert flow with `tableName/entityId/columnName` identifiers and the chosen winner / revert value.
- `RelationalConflictDetectionService` / `RelationalConflictResolverService` — detection, resolver branch (TWO_CHILDS vs TWO_FATHERS).
- `CrossEntityConflictDetectionService` / `CrossEntityConflictResolverService` — detect-for-pair, detect-for-wiring-robots, resolve, revert.
- `ConflictListService` / `ConflictEntityDetailService` — open-conflict counts, list pagination, entity detail fetches.
- `TableViewService` / `TableViewController` — query input summary, joins, row count, validation rejections.
- `EntityCatalogController` — config fetch.
- `FictiveReplacementService` / `FictiveDataTransferService` / `FictiveParentRedirectService` / `ConflictReattributionService` — the full fictive-to-real replacement chain.
- All major HTTP controllers (`auth`, `file`, `entity-catalog`, `table-view`, `conflicts`, `conflicts/value`, `conflicts/relational`, `conflicts/cross-entity`) — log on every request.

### Parser

- `main.py` — startup notice and per-request HTTP logging via middleware.
- `routers/parse.py` — request received, CSV header summary, hierarchy count, parse duration / failure.
- `assembler.py` — per-row hierarchy build, total count produced.
- `helpers/flatten.py` — per-hierarchy flattening trace.

## Conventions

- Prefer **complete sentences** that read like a story: the function/file name, what's happening, and the relevant identifiers (`tableName/entityId`, file name, row count, etc.).
- Include a short reference to the **caller** ("FileService.handleFile —"). When reading the log stream you can scan for it.
- Use `info` for the normal happy path and `debug` for inner-loop trace lines that would be too noisy at info level.
- Use `warn` for things the system handled gracefully but that operators should know about (rejected uploads, conflicts detected, unique-constraint races).
- Use `error` only for failures the service caught — let the global exception filter log truly unhandled exceptions.
- Always include the `'app-workflow'` literal as the second argument when describing user-driven flow. Reserve `'app-monitoring'` for telemetry/health.
- Never put secrets, JWTs, or PII inside the message.

## Example output

```json
{"timestamp":"2026-05-03T10:38:02.761818+00:00","level":"info","project":"buster","component":"parser","environment":"development","message":"assemble — produced 1 hierarchies from 1 row(s)","user":{"email":"system@buster.local","name":"system","role":"system"},"logContext":"app-workflow"}
```

```json
{"timestamp":"2026-05-03T10:38:42.121Z","level":"info","project":"buster","component":"server","environment":"development","message":"FileService.handleFile invoked — file: \"sample.csv\", size: 1024 bytes, user: \"alice@example.com\"","user":{"email":"system@buster.local","name":"system","role":"system"},"logContext":"app-workflow"}
```
