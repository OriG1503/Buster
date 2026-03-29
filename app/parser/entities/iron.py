from dataclasses import dataclass
from typing import Optional


@dataclass
class Iron:
    iron_UUID: str
    iron_type: Optional[str] = None
    iron_version: Optional[str] = None
    is_heat_conductor: Optional[bool] = None
    iron_is_stock_ashdod: Optional[bool] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    source_time: Optional[str] = None
