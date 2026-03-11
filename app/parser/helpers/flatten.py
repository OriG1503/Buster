import dataclasses


def flatten_hierarchy(obj):
    # Non-dataclass values (str, int, None, etc.) are returned as-is
    if not dataclasses.is_dataclass(obj):
        return obj

    cls_name = type(obj).__name__
    # Derive the primary entity field name from the class name (e.g. CommunicationHierarchy -> "communication")
    primary = cls_name[: -len("Hierarchy")].lower()
    result = {}

    for f in dataclasses.fields(obj):
        val = getattr(obj, f.name)
        if f.name == primary:
            # Inline the primary entity's fields directly into the result instead of nesting them
            if val is not None:
                result.update(dataclasses.asdict(val))
        else:
            # Recursively flatten child hierarchies; leaf entities are converted by asdict above
            result[f.name] = flatten_hierarchy(val)

    return result
