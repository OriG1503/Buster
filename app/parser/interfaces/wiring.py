from dataclasses import dataclass
from typing import Optional


@dataclass
class Wiring:
    wiring_UUID: str
    wiring_type: Optional[str] = None
    district: Optional[str] = None
    municipality: Optional[str] = None
    storage_UUID: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
