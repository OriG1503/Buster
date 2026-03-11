from pydantic import BaseModel


class ParseRequest(BaseModel):
    path: str
