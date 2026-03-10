from dataclasses import dataclass
from typing import Optional
from interfaces.wiring import Wiring
from interfaces.storage import Storage


@dataclass
class WiringHierarchy:
    wiring: Optional[Wiring] = None
    storage: Optional[Storage] = None
