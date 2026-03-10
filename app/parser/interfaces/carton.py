from dataclasses import dataclass
from typing import Optional


@dataclass
class Carton:
    carton_UUID: str
    carton_type: Optional[str] = None
    carton_version: Optional[str] = None
    source: Optional[str] = None
