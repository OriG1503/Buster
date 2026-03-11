from fastapi import APIRouter, HTTPException
from assembler import assemble
from helpers.flatten import flatten_hierarchy
from models.parse_request import ParseRequest
import csv

router = APIRouter()


@router.post("/parse")
async def parse_excel(body: ParseRequest):
    if not body.path.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        with open(body.path, encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {body.path}")

    hierarchies = assemble(rows)
    return [flatten_hierarchy(h) for h in hierarchies]
