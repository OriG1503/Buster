from dataclasses import dataclass
from typing import Optional
from interfaces.communication import Communication
from interfaces.iron import Iron
from hierarchies.plastic_hierarchy import PlasticHierarchy


@dataclass
class CommunicationHierarchy:
    communication: Optional[Communication] = None
    plastic: Optional[PlasticHierarchy] = None
    iron: Optional[Iron] = None
