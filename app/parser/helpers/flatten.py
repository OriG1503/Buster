import dataclasses

from shared.logger_service import logger_service


def flatten_hierarchy(obj):
    """
    Recursively flattens a hierarchy dataclass into a single dict.

    A hierarchy (e.g. RobotHierarchy) is a tree of nested entities. This function
    walks the tree and merges everything into one flat dict, where:
    - The primary entity's fields (e.g. Robot inside RobotHierarchy) are inlined at the top level.
    - Child hierarchies (e.g. WiringHierarchy) are recursed into and their fields merged in too.
    - Primitive values (str, int, None) are returned as-is.
    """

    if not dataclasses.is_dataclass(obj):
        # Primitive value (str, int, None, etc.) — return as-is
        return obj

    if not type(obj).__name__.endswith("Hierarchy"):
        # Leaf entity (e.g. Robot, Battery) — convert all fields to a plain dict
        return dataclasses.asdict(obj)

    primary_field = type(obj).__name__.removesuffix("Hierarchy").lower()
    logger_service.debug(
        f"flatten_hierarchy — flattening \"{type(obj).__name__}\" with primary field \"{primary_field}\"",
        "app-workflow",
    )
    result = {}

    for field in dataclasses.fields(obj):
        value = getattr(obj, field.name)

        if field.name == primary_field:
            if value is not None:
                result.update(dataclasses.asdict(value))

        else:
            result[field.name] = flatten_hierarchy(value)

    return result
