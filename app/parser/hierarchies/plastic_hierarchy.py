from dataclasses import dataclass
from typing import Optional
from entities.plastic import Plastic
from entities.battery import Battery


@dataclass
class PlasticHierarchy:
    plastic: Optional[Plastic] = None
    battery: Optional[Battery] = None
