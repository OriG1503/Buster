from dataclasses import dataclass
from typing import Optional


@dataclass
class Plastic:
    plastic_UUID: str
    plastic_type: Optional[str] = None
    battery_UUID: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    source_time: Optional[str] = None
