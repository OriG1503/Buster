from dataclasses import dataclass
from typing import Optional


@dataclass
class Storage:
    storage_UUID: str
    storage_type: Optional[str] = None
    storage_version: Optional[str] = None
    is_stock_netanya: Optional[bool] = None
    is_stock_afula: Optional[bool] = None
    notes: Optional[str] = None
    source: Optional[str] = None
