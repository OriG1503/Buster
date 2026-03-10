from dataclasses import dataclass
from typing import Optional


@dataclass
class Communication:
    communication_UUID: str
    communication_type: Optional[str] = None
    plastic_UUID: Optional[str] = None
    iron_UUID: Optional[str] = None
    source: Optional[str] = None
