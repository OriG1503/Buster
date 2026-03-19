from dataclasses import dataclass
from typing import Optional


@dataclass
class Sensor:
    sensor_UUID: str
    sensor_type: Optional[str] = None
    sensor_version: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
