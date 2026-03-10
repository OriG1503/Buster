from fastapi import FastAPI, UploadFile, File, HTTPException
from assembler import assemble
import dataclasses
import openpyxl
import io

app = FastAPI()


def _flatten_hierarchy(obj):
    # Non-dataclass values (str, int, None, etc.) are returned as-is
    if not dataclasses.is_dataclass(obj):
        return obj

    cls_name = type(obj).__name__
    # Derive the primary entity field name from the class name (e.g. CommunicationHierarchy -> "communication")
    primary = cls_name[: -len("Hierarchy")].lower()
    result = {}

    for f in dataclasses.fields(obj):
        val = getattr(obj, f.name)
        if f.name == primary:
            # Inline the primary entity's fields directly into the result instead of nesting them
            if val is not None:
                result.update(dataclasses.asdict(val))
        else:
            # Recursively flatten child hierarchies; leaf entities are converted by asdict above
            result[f.name] = _flatten_hierarchy(val)

    return result


@app.post("/parse")
async def parse_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be an Excel file")

    contents = await file.read()
    workbook = openpyxl.load_workbook(io.BytesIO(contents))

    # Read every sheet into a dict: { sheet_name -> [{ column: value, ... }, ...] }
    sheets = {}
    for sheet_name in workbook.sheetnames:
        sheet = workbook[sheet_name]
        headers = [cell.value for cell in next(sheet.iter_rows(min_row=1, max_row=1))]
        sheets[sheet_name.lower()] = [
            {headers[i]: cell.value for i, cell in enumerate(row)}
            for row in sheet.iter_rows(min_row=2)
        ]

    hierarchies = assemble(sheets)
    return [_flatten_hierarchy(h) for h in hierarchies]
