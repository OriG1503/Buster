import time

from fastapi import FastAPI, Request
from routers.parse import parse_csv_router
from shared.logger_service import logger_service

app = FastAPI()


@app.middleware("http")
async def _log_requests(request: Request, call_next):
    logger_service.info(
        f"HTTP request received — {request.method} {request.url.path}",
        "app-workflow",
    )
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000)
    message = f"HTTP response sent — {request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)"
    if response.status_code >= 500:
        logger_service.error(message, "app-workflow")
    elif response.status_code >= 400:
        logger_service.warn(message, "app-workflow")
    else:
        logger_service.info(message, "app-workflow")
    return response


@app.on_event("startup")
async def _on_startup() -> None:
    logger_service.info("FastAPI parser service started — routes registered", "app-workflow")


app.include_router(parse_csv_router)
