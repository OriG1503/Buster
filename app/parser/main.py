import logging
import time

from fastapi import FastAPI, Request
from routers.parse import parse_csv_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

app = FastAPI()
_logger = logging.getLogger("HTTP")


@app.middleware("http")
async def _log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000)
    level = logging.WARNING if response.status_code >= 400 else logging.INFO
    _logger.log(level, f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)")
    return response


app.include_router(parse_csv_router)
