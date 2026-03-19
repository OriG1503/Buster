from dataclasses import dataclass
from typing import Optional
from entities.communication import Communication
from entities.iron import Iron
from hierarchies.plastic_hierarchy import PlasticHierarchy


@dataclass
class CommunicationHierarchy:
    communication: Optional[Communication] = None
    plastic: Optional[PlasticHierarchy] = None
    iron: Optional[Iron] = None
