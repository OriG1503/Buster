from dataclasses import dataclass
from typing import Optional


@dataclass
class Cardboard:
    cardboard_UUID: str
    cardboard_type: Optional[str] = None
    cardboard_version: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    source_time: Optional[str] = None
