import csv
import time

from fastapi import APIRouter, HTTPException
from assembler import assemble
from helpers.flatten import flatten_hierarchy
from models.parse_request import ParseRequest
from shared.logger_service import logger_service

parse_csv_router = APIRouter(tags=["Parse CSV"])


@parse_csv_router.post("/parse")
async def parse_excel(body: ParseRequest):
    path = body.path.replace("\\", "/")
    logger_service.info(f"parse_excel — POST /parse received with path \"{path}\"", "app-workflow")

    if not path.endswith(".csv"):
        logger_service.warn(f"parse_excel — rejected non-CSV path \"{path}\"", "app-workflow")
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    logger_service.info(f"parse_excel — opening CSV at \"{path}\" for parsing", "app-workflow")
    start = time.perf_counter()

    try:
        with open(path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            logger_service.debug(
                f"parse_excel — CSV headers detected: [{', '.join(reader.fieldnames or [])}]",
                "app-workflow",
            )
            hierarchies = list(assemble(reader))
            logger_service.debug(
                f"parse_excel — assembled {len(hierarchies)} robot hierarchies, flattening to dicts",
                "app-workflow",
            )
            rows = [flatten_hierarchy(h) for h in hierarchies]

        duration_ms = round((time.perf_counter() - start) * 1000)
        logger_service.info(
            f"parse_excel — produced {len(rows)} parsed row(s) in {duration_ms}ms for \"{path}\"",
            "app-workflow",
        )
        return rows

    except FileNotFoundError:
        logger_service.error(f"parse_excel — file not found at \"{path}\"", "app-workflow")
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    except Exception as e:
        logger_service.error(f"parse_excel — parse failed for \"{path}\": {e}", "app-workflow")
        raise HTTPException(status_code=500, detail=f"Parse failed: {e}")
