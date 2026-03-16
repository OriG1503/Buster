from dataclasses import dataclass
from typing import Optional


@dataclass
class Robot:
    robot_UUID: str
    cardboard_UUID: Optional[str] = None
    sensor_UUID: Optional[str] = None
    communication_UUID: Optional[str] = None
    wiring_UUID: Optional[str] = None
    sale_UUID: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
