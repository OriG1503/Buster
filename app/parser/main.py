from fastapi import FastAPI
from routers.parse import parse_csv_router

app = FastAPI()
app.include_router(parse_csv_router)
