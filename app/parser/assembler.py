import dataclasses
from interfaces.robot import Robot
from interfaces.sensor import Sensor
from interfaces.cardboard import Cardboard
from interfaces.communication import Communication
from interfaces.plastic import Plastic
from interfaces.battery import Battery
from interfaces.iron import Iron
from interfaces.sale import Sale
from interfaces.wiring import Wiring
from interfaces.storage import Storage
from hierarchies.communication_hierarchy import CommunicationHierarchy
from hierarchies.plastic_hierarchy import PlasticHierarchy
from hierarchies.wiring_hierarchy import WiringHierarchy
from hierarchies.robot_hierarchy import RobotHierarchy

# Maps each entity class to the Excel column name used as its primary key.
# A missing or empty UUID means that entity is absent from this row.
_UUID_FIELDS = {
    Robot: "robot_UUID",
    Sensor: "sensor_UUID",
    Cardboard: "cardboard_UUID",
    Communication: "communication_UUID",
    Plastic: "plastic_UUID",
    Battery: "battery_UUID",
    Iron: "iron_UUID",
    Sale: "sale_UUID",
    Wiring: "wiring_UUID",
    Storage: "storage_UUID",
}


def _build_entity(cls, row: dict, sheet_name: str):
    # Skip the entity entirely if its UUID column is absent or empty
    if not row.get(_UUID_FIELDS[cls]):
        return None
    cls_fields = dataclasses.fields(cls)
    # Only map columns that exist in the row (extra columns are ignored)
    data = {f.name: row[f.name] for f in cls_fields if f.name in row}
    return cls(**data)


def _build_hierarchy_from_row(row: dict, sheet_name: str) -> RobotHierarchy:
    # Each row can contain data for multiple entities; build each one and nest them
    return RobotHierarchy(
        _build_entity(Robot, row, sheet_name),

        cardboard=_build_entity(Cardboard, row, sheet_name),

        sensor=_build_entity(Sensor, row, sheet_name),

        communication=CommunicationHierarchy(
            _build_entity(Communication, row, sheet_name),

            plastic=PlasticHierarchy(
                _build_entity(Plastic, row, sheet_name),
                battery=_build_entity(Battery, row, sheet_name),
            ),

            iron=_build_entity(Iron, row, sheet_name),
        ),

        wiring=WiringHierarchy(
            _build_entity(Wiring, row, sheet_name),

            storage=_build_entity(Storage, row, sheet_name),
        ),

        sale=_build_entity(Sale, row, sheet_name),
    )


def assemble(sheets: dict[str, list[dict]]) -> list[RobotHierarchy]:
    # Only the first sheet is processed; fully empty rows are skipped
    sheet_name, rows = next(iter(sheets.items()))
    return [
        _build_hierarchy_from_row(row, sheet_name)
        for row in rows
        if any(v is not None for v in row.values())
    ]
