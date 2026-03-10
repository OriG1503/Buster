from dataclasses import dataclass
from typing import Optional
from interfaces.robot import Robot
from interfaces.sensor import Sensor
from interfaces.cardboard import Cardboard
from interfaces.sale import Sale
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
