import dataclasses
from entities.robot import Robot
from entities.sensor import Sensor
from entities.cardboard import Cardboard
from entities.communication import Communication
from entities.plastic import Plastic
from entities.battery import Battery
from entities.iron import Iron
from entities.sale import Sale
from entities.wiring import Wiring
from entities.storage import Storage
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


def _build_entity(cls, row: dict):
    """
    Attempts to build a single entity instance from a CSV row.

    Extracts only the fields that belong to the given entity class from the row,
    then decides whether the entity is present based on its UUID and data fields:
    - If both UUID and data are missing → the entity is absent, returns None.
    - If data exists but UUID is missing → a "flying" entity (server will handle it).
    - Otherwise → returns a fully populated entity instance.
    """

    uuid_field = _UUID_FIELDS[cls]
    cls_fields = dataclasses.fields(cls)
    data = {f.name: row[f.name] for f in cls_fields if f.name in row}

    has_uuid = bool(data.get(uuid_field))
    has_data = any(v for k, v in data.items() if k != uuid_field and v)

    if not has_uuid and not has_data:
        return None

    # Flying entity: has data fields but no UUID — include with empty UUID so server can detect it
    if not has_uuid:
        data[uuid_field] = ''

    return cls(**data)


def _build_hierarchy_from_row(row: dict) -> RobotHierarchy:
    """
    Builds a full RobotHierarchy from a single CSV row.

    Each row can carry data for multiple entities at once. This function constructs
    each entity from the relevant columns and nests them into the hierarchy tree:

    RobotHierarchy
    ├── Robot
    ├── Cardboard
    ├── Sensor
    ├── CommunicationHierarchy
    │   ├── Communication
    │   ├── Iron
    │   └── PlasticHierarchy
    │       ├── Plastic
    │       └── Battery
    ├── WiringHierarchy
    │   ├── Wiring
    │   └── Storage
    └── Sale
    """

    return RobotHierarchy(
        _build_entity(Robot, row),

        cardboard=_build_entity(Cardboard, row),

        sensor=_build_entity(Sensor, row),

        communication=CommunicationHierarchy(
            _build_entity(Communication, row),

            plastic=PlasticHierarchy(
                _build_entity(Plastic, row),
                battery=_build_entity(Battery, row),
            ),

            iron=_build_entity(Iron, row),
        ),

        wiring=WiringHierarchy(
            _build_entity(Wiring, row),

            storage=_build_entity(Storage, row),
        ),

        sale=_build_entity(Sale, row),
    )


def assemble(rows):
    """
    Iterates over CSV rows and yields a RobotHierarchy for each non-empty row.

    Skips rows where all values are None (e.g. trailing empty lines in the CSV).
    """
    
    for row in rows:
        if any(v is not None for v in row.values()):
            yield _build_hierarchy_from_row(row)
