import csv
import logging
import time

from fastapi import APIRouter, HTTPException
from assembler import assemble
from helpers.flatten import flatten_hierarchy
from models.parse_request import ParseRequest

_logger = logging.getLogger("parse")
parse_csv_router = APIRouter(tags=["Parse CSV"])


@parse_csv_router.post("/parse")
async def parse_excel(body: ParseRequest):
    if not body.path.endswith(".csv"):
        _logger.warning(f"Rejected non-CSV path: {body.path}")
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    _logger.info(f"Parsing: {body.path}")
    start = time.perf_counter()

    try:
        with open(body.path, encoding="utf-8") as f:
            rows = [flatten_hierarchy(h) for h in assemble(csv.DictReader(f))]

        duration_ms = round((time.perf_counter() - start) * 1000)
        _logger.info(f"Parsed {len(rows)} rows in {duration_ms}ms")
        return rows

    except FileNotFoundError:
        _logger.error(f"File not found: {body.path}")
        raise HTTPException(status_code=404, detail=f"File not found: {body.path}")
    except Exception as e:
        _logger.error(f"Parse failed for {body.path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Parse failed: {e}")
