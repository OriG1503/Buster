from dataclasses import dataclass
from typing import Optional
from entities.wiring import Wiring
from entities.storage import Storage


@dataclass
class WiringHierarchy:
    wiring: Optional[Wiring] = None
    storage: Optional[Storage] = None
