from dataclasses import dataclass
from typing import Optional
from interfaces.plastic import Plastic
from interfaces.battery import Battery


@dataclass
class PlasticHierarchy:
    plastic: Optional[Plastic] = None
    battery: Optional[Battery] = None
