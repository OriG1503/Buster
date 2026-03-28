from dataclasses import dataclass
from typing import Optional


@dataclass
class Battery:
    battery_UUID: str
    sku: Optional[str] = None
    battery_type: Optional[str] = None
    battery_version: Optional[str] = None
    lithium_version: Optional[str] = None
    battery_name: Optional[str] = None
    sales_person: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None

