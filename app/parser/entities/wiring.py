from dataclasses import dataclass
from typing import Optional


@dataclass
class Wiring:
    wiring_UUID: str
    wiring_type: Optional[str] = None
    wiring_district: Optional[str] = None
    wiring_store_name: Optional[str] = None
    storage_UUID: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    source_time: Optional[str] = None
