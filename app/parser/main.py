from fastapi import FastAPI
from routers.parse import router

app = FastAPI()
app.include_router(router)
