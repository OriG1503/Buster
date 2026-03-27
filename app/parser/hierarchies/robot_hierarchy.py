from dataclasses import dataclass
from typing import Optional
from entities.robot import Robot
from entities.sensor import Sensor
from entities.cardboard import Cardboard
from entities.sale import Sale
from hierarchies.communication_hierarchy import CommunicationHierarchy
from hierarchies.wiring_hierarchy import WiringHierarchy


@dataclass
class RobotHierarchy:
    robot: Optional[Robot] = None
    cardboard: Optional[Cardboard] = None
    sensor: Optional[Sensor] = None
    communication: Optional[CommunicationHierarchy] = None
    wiring: Optional[WiringHierarchy] = None
    sale: Optional[Sale] = None
