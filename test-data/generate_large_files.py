"""
Generates large combined xlsx files for durability/stress testing.
Every row uses ALL_COLS (all entity fields in one row).
Files are designed to be uploaded sequentially to maximize conflict density.
"""

import csv
from pathlib import Path
import random

OUT_DIR = Path(__file__).parent / "csv"
OUT_DIR.mkdir(exist_ok=True)

# Maps parser snake_case field names → Hebrew csvHeader values (from entity-configs.const.ts)
PARSER_TO_HEBREW = {
    "robot_UUID":               "מזהה רובוט",
    "cardboard_UUID":           "מזהה קרטון",
    "sensor_UUID":              "מזהה חיישן",
    "communication_UUID":       "מזהה תקשורת",
    "wiring_UUID":              "מזהה כבל",
    "carrier":                  "ספק שילוח",
    "is_purchased":             "נרכש",
    "robot_district":           "מחוז רובוט",
    "robot_store_name":         "שם חנות רובוט",
    "robot_is_stock_ashdod":    "מלאי אשדוד רובוט",
    "robot_is_stock_tel_aviv":  "מלאי תל אביב רובוט",
    "robot_is_stock_rehovot":   "מלאי רחובות רובוט",
    "robot_is_stock_netanya":   "מלאי נתניה רובוט",
    "robot_is_stock_afula":     "מלאי עפולה רובוט",
    "cardboard_type":           "סוג קרטון",
    "cardboard_version":        "גרסת קרטון",
    "sensor_type":              "סוג חיישן",
    "sensor_version":           "גרסת חיישן",
    "communication_type":       "סוג תקשורת",
    "plastic_UUID":             "מזהה פלסטיק",
    "iron_UUID":                "מזהה ברזל",
    "plastic_type":             "סוג פלסטיק",
    "battery_UUID":             "מזהה סוללה",
    "sku":                      'מק"ט',
    "battery_type":             "סוג סוללה",
    "battery_version":          "גרסת סוללה",
    "lithium_version":          "גרסת ליתיום",
    "battery_name":             "שם סוללה",
    "sales_person":             "איש מכירות",
    "battery_is_stock_tel_aviv": "מלאי תל אביב סוללה",
    "battery_is_stock_rehovot":  "מלאי רחובות סוללה",
    "iron_type":                "סוג ברזל",
    "iron_version":             "גרסת ברזל",
    "heat_conductor":           "מוליך חום",
    "iron_is_stock_ashdod":     "מלאי אשדוד ברזל",
    "wiring_type":              "סוג חיווט",
    "wiring_district":          "מחוז חיווט",
    "wiring_store_name":        "שם חנות חיווט",
    "storage_UUID":             "מזהה אחסון",
    "storage_type":             "סוג אחסון",
    "storage_version":          "גרסת אחסון",
    "storage_is_stock_netanya": "מלאי נתניה אחסון",
    "storage_is_stock_afula":   "מלאי עפולה אחסון",
    "notes":                    "הערה",
    "source":                   'מ"ד',
    "source_time":              "תאריך מקור",
}

# ─── ID helpers ──────────────────────────────────────────────────────────────

def rid(n):  return f"robot-{n:04d}"
def sid(n):  return f"sens-{n:04d}"
def cbid(n): return f"cb-{n:04d}"
def cid(n):  return f"comm-{n:04d}"
def pid(n):  return f"plast-{n:04d}"
def bid(n):  return f"batt-{n:04d}"
def iid(n):  return f"iron-{n:04d}"
def wid(n):  return f"wir-{n:04d}"
def stid(n): return f"stor-{n:04d}"

# ─── Value pools ─────────────────────────────────────────────────────────────

CARRIERS        = ["DHL", "FedEx", "UPS", "Israel Post", "Maersk", "ZIM", "DB Schenker", "TNT", "Kuehne+Nagel", "DSV"]
DISTRICTS       = ["North", "South", "Center", "Haifa Bay", "Jerusalem", "Tel Aviv", "Negev", "Galilee", "Jezreel Valley", "Sharon"]
STORES          = ["Main Warehouse", "Branch A", "Branch B", "Factory Floor", "Depot North", "Depot South", "HQ Store", "Sub-Depot East", "Logistics Hub", "Field Store"]
SENSOR_TYPES    = ["LiDAR", "Ultrasonic", "Infrared", "Camera", "Radar", "Thermal", "Proximity", "Gyroscope", "Accelerometer", "Magnetometer"]
SENSOR_VERS     = ["v1.0", "v1.1", "v2.0", "v2.1", "v3.0", "v3.1", "v4.0", "v4.1", "v5.0"]
CB_TYPES        = ["Single Wall", "Double Wall", "Triple Wall", "Micro Flute", "Kraft Brown", "White Coated", "Recycled"]
CB_VERS         = ["rev-A", "rev-B", "rev-C", "2024", "2025", "2026", "2026-Q1", "2026-Q2"]
COMM_TYPES      = ["WiFi 6", "5G", "Bluetooth 5.2", "Zigbee", "LoRa", "Ethernet", "CAN Bus", "Modbus", "Profinet", "OPC-UA"]
PLASTIC_TYPES   = ["ABS", "PVC", "Polycarbonate", "Nylon", "PEEK", "HDPE", "Polypropylene", "POM", "PTFE", "Ultem"]
BATTERY_TYPES   = ["Li-Ion", "LiFePO4", "NiMH", "Solid State", "Li-Polymer", "Lead Acid", "Zinc-Air", "Sodium-Ion"]
BATTERY_VERS    = ["gen1", "gen2", "gen3", "2024-A", "2024-B", "2025-A", "2025-B", "2026-A"]
LI_VERS         = ["LiV1", "LiV2", "LiV3", "LiV4", "NMC-1", "NMC-2", "LFP-1", "LFP-2", "NCA-1"]
BATTERY_NAMES   = ["PowerCell A", "PowerCell B", "MegaCell", "UltraCell", "RoboPower", "InduCell", "HeavyDuty", "SlimPack", "DuraPack", "FlexCell"]
SALES_PERSONS   = ["Avi Cohen", "Tamar Levi", "Yossi Bar", "Dana Mizrahi", "Roi Shapiro", "Noa Klein", "Eran Peretz", "Hila Gross", "Benny Ziv", "Maya Dar"]
IRON_TYPES      = ["Cast Iron", "Wrought Iron", "Steel Alloy", "Stainless", "Galvanized", "Carbon Steel", "Titanium Alloy", "Chromoly"]
IRON_VERS       = ["v1", "v2", "v3", "2024", "2025", "A-grade", "B-grade", "Premium"]
HEAT_CONDS      = ["Copper", "Aluminum", "Silver", "Graphene", "Thermal Paste", "None", "Diamond Film", "Phase-Change"]
WIRING_TYPES    = ["12V DC", "24V DC", "48V DC", "AC 220V", "CAN Bus", "Ethernet Cat6", "Fiber Optic", "RS-485", "Modbus RTU", "DeviceNet"]
WIRING_DIST     = ["Industrial Zone A", "Industrial Zone B", "Factory District", "Port Area", "R&D Campus", "Assembly Hall", "Test Floor", "QA Zone"]
WIRING_STORES   = ["Cable Depot", "Wiring Hub", "Assembly Line Store", "Component Store", "Main Store", "Electrical Room", "Panel Shop"]
STORAGE_TYPES   = ["SSD", "HDD", "Flash", "NVMe", "eMMC", "SD Card", "Industrial SSD", "RAID Array", "Tape Archive"]
STORAGE_VERS    = ["v1.0", "v2.0", "v3.0", "2024", "2025", "Pro", "Standard", "Enterprise", "Lite"]

SOURCES = {
    "CRM":       "2026-01-10T08:00:00Z",
    "ERP":       "2026-02-01T10:00:00Z",
    "WMS":       "2026-02-20T08:00:00Z",
    "SAP":       "2026-03-01T12:00:00Z",
    "Salesforce":"2026-03-10T09:30:00Z",
    "Manual":    "2026-03-15T14:00:00Z",
    "HQ DB":     "2026-03-25T11:00:00Z",
    "Audit 2026":"2026-04-01T09:00:00Z",
    "Supplier Portal": "2026-01-20T07:00:00Z",
    "Legacy ERP":"2025-06-01T06:00:00Z",
}

NOTES_POOL = [
    "Verified by QA team",
    "Updated after site visit",
    "Imported from legacy system — cross-check pending",
    "Manual correction applied by field engineer",
    "Pending physical verification",
    "Approved by field inspector",
    "Cross-referenced with supplier invoice",
    "Data from quarterly audit",
    "Automated sync — not yet verified",
    "Priority item — fast tracked",
    "Discrepancy noted — awaiting supplier confirmation",
    "Data validated against shipment manifest",
    "Stock count differs from system — recount ordered",
    "Updated after production line change",
    "Emergency patch — revert if invalid",
    None, None, None, None,  # ~20% empty notes
]

def note():  return random.choice(NOTES_POOL)
def bval():  return random.choice([True, False])
def bnull(): return random.choice([True, False, None])


# ─── Core row builder ─────────────────────────────────────────────────────────

ALL_COLS = [
    "robot_UUID", "cardboard_UUID", "sensor_UUID", "communication_UUID", "wiring_UUID",
    "carrier", "is_purchased", "robot_district", "robot_store_name",
    "robot_is_stock_ashdod", "robot_is_stock_tel_aviv", "robot_is_stock_rehovot",
    "robot_is_stock_netanya", "robot_is_stock_afula",
    "cardboard_type", "cardboard_version",
    "sensor_type", "sensor_version",
    "communication_type", "plastic_UUID", "iron_UUID",
    "plastic_type", "battery_UUID",
    "sku", "battery_type", "battery_version", "lithium_version", "battery_name",
    "sales_person", "battery_is_stock_tel_aviv", "battery_is_stock_rehovot",
    "iron_type", "iron_version", "heat_conductor", "iron_is_stock_ashdod",
    "wiring_type", "wiring_district", "wiring_store_name", "storage_UUID",
    "storage_type", "storage_version", "storage_is_stock_netanya", "storage_is_stock_afula",
    "notes", "source", "source_time",
]


def full_row(robot_n: int, source: str, overrides: dict = None, sparse_mask: set = None) -> dict:
    """
    Build a fully populated combined row for robot-N.
    sparse_mask: set of field names to blank out (simulate partial rows).
    overrides: dict of fields to forcibly set (for conflict generation).
    """
    row = {
        "robot_UUID":               rid(robot_n),
        "cardboard_UUID":           cbid(robot_n),
        "sensor_UUID":              sid(robot_n),
        "communication_UUID":       cid(robot_n),
        "wiring_UUID":              wid(robot_n),
        "carrier":                  random.choice(CARRIERS),
        "is_purchased":             bval(),
        "robot_district":           random.choice(DISTRICTS),
        "robot_store_name":         random.choice(STORES),
        "robot_is_stock_ashdod":    bval(),
        "robot_is_stock_tel_aviv":  bval(),
        "robot_is_stock_rehovot":   bval(),
        "robot_is_stock_netanya":   bval(),
        "robot_is_stock_afula":     bval(),
        "cardboard_type":           random.choice(CB_TYPES),
        "cardboard_version":        random.choice(CB_VERS),
        "sensor_type":              random.choice(SENSOR_TYPES),
        "sensor_version":           random.choice(SENSOR_VERS),
        "communication_type":       random.choice(COMM_TYPES),
        "plastic_UUID":             pid(robot_n),
        "iron_UUID":                iid(robot_n),
        "plastic_type":             random.choice(PLASTIC_TYPES),
        "battery_UUID":             bid(robot_n),
        "sku":                      f"SKU-{robot_n:05d}-{random.randint(100,999)}",
        "battery_type":             random.choice(BATTERY_TYPES),
        "battery_version":          random.choice(BATTERY_VERS),
        "lithium_version":          random.choice(LI_VERS),
        "battery_name":             random.choice(BATTERY_NAMES),
        "sales_person":             random.choice(SALES_PERSONS),
        "battery_is_stock_tel_aviv": bval(),
        "battery_is_stock_rehovot":  bval(),
        "iron_type":                random.choice(IRON_TYPES),
        "iron_version":             random.choice(IRON_VERS),
        "heat_conductor":           random.choice(HEAT_CONDS),
        "iron_is_stock_ashdod":     bval(),
        "wiring_type":              random.choice(WIRING_TYPES),
        "wiring_district":          random.choice(WIRING_DIST),
        "wiring_store_name":        random.choice(WIRING_STORES),
        "storage_UUID":             stid(robot_n),
        "storage_type":             random.choice(STORAGE_TYPES),
        "storage_version":          random.choice(STORAGE_VERS),
        "storage_is_stock_netanya": bval(),
        "storage_is_stock_afula":   bval(),
        "notes":                    note(),
        "source":                   source,
        "source_time":              SOURCES[source],
    }
    if sparse_mask:
        for field in sparse_mask:
            row[field] = None
    if overrides:
        row.update(overrides)
    return row


def conflict_row(robot_n: int, source: str, base_row: dict, fields_to_conflict: list[str]) -> dict:
    """Clone base_row but pick a different value for each conflicting field."""
    row = base_row.copy()
    row["source"] = source
    row["source_time"] = SOURCES[source]
    row["notes"] = note()

    POOLS = {
        "carrier":              CARRIERS,
        "robot_district":       DISTRICTS,
        "robot_store_name":     STORES,
        "cardboard_type":       CB_TYPES,
        "cardboard_version":    CB_VERS,
        "sensor_type":          SENSOR_TYPES,
        "sensor_version":       SENSOR_VERS,
        "communication_type":   COMM_TYPES,
        "plastic_type":         PLASTIC_TYPES,
        "battery_type":         BATTERY_TYPES,
        "battery_version":      BATTERY_VERS,
        "lithium_version":      LI_VERS,
        "battery_name":         BATTERY_NAMES,
        "sales_person":         SALES_PERSONS,
        "iron_type":            IRON_TYPES,
        "iron_version":         IRON_VERS,
        "heat_conductor":       HEAT_CONDS,
        "wiring_type":          WIRING_TYPES,
        "wiring_district":      WIRING_DIST,
        "wiring_store_name":    WIRING_STORES,
        "storage_type":         STORAGE_TYPES,
        "storage_version":      STORAGE_VERS,
    }
    BOOL_FIELDS = {
        "is_purchased", "robot_is_stock_ashdod", "robot_is_stock_tel_aviv",
        "robot_is_stock_rehovot", "robot_is_stock_netanya", "robot_is_stock_afula",
        "battery_is_stock_tel_aviv", "battery_is_stock_rehovot",
        "iron_is_stock_ashdod", "storage_is_stock_netanya", "storage_is_stock_afula",
    }
    for field in fields_to_conflict:
        if field in BOOL_FIELDS:
            row[field] = not base_row[field] if base_row[field] is not None else True
        elif field in POOLS:
            pool = [v for v in POOLS[field] if v != base_row.get(field)]
            row[field] = random.choice(pool) if pool else POOLS[field][0]
    return row


# ─── XLSX writer ─────────────────────────────────────────────────────────────

def write_xlsx(filename: str, rows: list[dict]):
    path = OUT_DIR / filename.replace('.xlsx', '.csv')
    hebrew_headers = [PARSER_TO_HEBREW[col] for col in ALL_COLS]
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(hebrew_headers)
        for row in rows:
            writer.writerow([row.get(col) for col in ALL_COLS])
    print(f"  {path.name}  ({len(rows)} rows)")


# ─── FILE A: Base — 200 robots, CRM source, fully populated ──────────────────

def gen_large_A():
    """
    200 fully populated robots from CRM.
    This is the foundation — all subsequent files conflict against these.
    """
    random.seed(100)
    rows = [full_row(n, "CRM") for n in range(1, 201)]
    write_xlsx("large_A_crm_base_200.xlsx", rows)
    return {n: rows[n - 1] for n in range(1, 201)}


# ─── FILE B: ERP conflicts — 200 rows, same robots, many string conflicts ─────

def gen_large_B(base: dict):
    """
    All 200 robots from ERP with conflicting string values on 4-6 fields per robot.
    Every robot gets a different randomly chosen subset of conflicting fields.
    """
    random.seed(101)
    CONFLICT_FIELD_GROUPS = [
        ["carrier", "battery_type", "communication_type", "storage_type"],
        ["carrier", "sensor_type", "iron_type", "wiring_type"],
        ["robot_district", "robot_store_name", "cardboard_type", "plastic_type"],
        ["battery_version", "lithium_version", "iron_version", "storage_version"],
        ["carrier", "communication_type", "sensor_type", "battery_name", "sales_person"],
        ["robot_district", "battery_type", "wiring_type", "storage_type", "plastic_type"],
        ["cardboard_type", "cardboard_version", "sensor_version", "iron_type"],
        ["carrier", "battery_type", "robot_store_name", "wiring_district"],
    ]
    rows = []
    for n in range(1, 201):
        fields = random.choice(CONFLICT_FIELD_GROUPS)
        rows.append(conflict_row(n, "ERP", base[n], fields))
    write_xlsx("large_B_erp_string_conflicts_200.xlsx", rows)


# ─── FILE C: WMS — 200 rows, boolean conflicts + some string ─────────────────

def gen_large_C(base: dict):
    """
    All 200 robots from WMS. Conflicts are mostly boolean (stock locations)
    plus 1-2 string fields. Simulates a warehouse system sync.
    """
    random.seed(102)
    BOOL_FIELDS = [
        "robot_is_stock_ashdod", "robot_is_stock_tel_aviv", "robot_is_stock_rehovot",
        "robot_is_stock_netanya", "robot_is_stock_afula",
        "battery_is_stock_tel_aviv", "battery_is_stock_rehovot",
        "iron_is_stock_ashdod", "storage_is_stock_netanya", "storage_is_stock_afula",
        "is_purchased",
    ]
    rows = []
    for n in range(1, 201):
        # Pick 3-6 boolean conflicts + 1 optional string conflict
        n_bools = random.randint(3, 6)
        fields = random.sample(BOOL_FIELDS, n_bools)
        if random.random() > 0.4:
            fields.append(random.choice(["carrier", "storage_type", "wiring_type"]))
        rows.append(conflict_row(n, "WMS", base[n], fields))
    write_xlsx("large_C_wms_boolean_conflicts_200.xlsx", rows)


# ─── FILE D: SAP — 150 existing + 100 new robots ─────────────────────────────

def gen_large_D(base: dict):
    """
    150 existing robots (1-150) with SAP data — some overlap with CRM/ERP/WMS.
    100 new robots (201-300) introduced fresh from SAP.
    Partial rows (~30%) — some fields deliberately left blank.
    """
    random.seed(103)
    rows = []

    # 150 existing with targeted conflicts on a mix of field types
    for n in range(1, 151):
        num_conflicts = random.randint(2, 5)
        all_conflictable = [
            "carrier", "robot_district", "robot_store_name",
            "sensor_type", "sensor_version", "cardboard_type", "cardboard_version",
            "communication_type", "plastic_type", "battery_type", "battery_version",
            "lithium_version", "battery_name", "sales_person",
            "iron_type", "iron_version", "heat_conductor",
            "wiring_type", "wiring_district", "wiring_store_name",
            "storage_type", "storage_version",
            "is_purchased", "robot_is_stock_ashdod", "battery_is_stock_tel_aviv",
            "storage_is_stock_netanya",
        ]
        fields = random.sample(all_conflictable, num_conflicts)
        rows.append(conflict_row(n, "SAP", base[n], fields))

    # 100 new robots — mix of full and partial rows
    SPARSE_SETS = [
        set(),  # full
        {"cardboard_type", "cardboard_version"},  # missing cardboard data
        {"iron_type", "iron_version", "heat_conductor"},  # missing iron data
        {"wiring_district", "wiring_store_name", "storage_version"},  # missing wiring details
        {"sensor_version", "battery_version", "lithium_version"},  # missing versions
        {"is_purchased", "robot_is_stock_ashdod", "robot_is_stock_tel_aviv",
         "robot_is_stock_rehovot", "robot_is_stock_netanya", "robot_is_stock_afula"},  # all stock bools null
        {"sales_person", "battery_name", "sku"},  # missing sales info
    ]
    for n in range(201, 301):
        sparse = random.choice(SPARSE_SETS)
        rows.append(full_row(n, "SAP", sparse_mask=sparse))

    write_xlsx("large_D_sap_mixed_250.xlsx", rows)


# ─── FILE E: Salesforce — 200 rows, heavy FK + deep string conflicts ──────────

def gen_large_E(base: dict):
    """
    200 robots (1-200) from Salesforce CRM.
    Conflicts on nearly every string field — maximum conflict density.
    Some rows also have different FK UUIDs for wiring/communication to test FK conflicts.
    """
    random.seed(104)
    rows = []
    ALL_STRING_FIELDS = [
        "carrier", "robot_district", "robot_store_name",
        "cardboard_type", "cardboard_version",
        "sensor_type", "sensor_version",
        "communication_type", "plastic_type",
        "battery_type", "battery_version", "lithium_version",
        "battery_name", "sales_person",
        "iron_type", "iron_version", "heat_conductor",
        "wiring_type", "wiring_district", "wiring_store_name",
        "storage_type", "storage_version",
    ]
    ALL_BOOL_FIELDS = [
        "is_purchased",
        "robot_is_stock_ashdod", "robot_is_stock_tel_aviv", "robot_is_stock_rehovot",
        "robot_is_stock_netanya", "robot_is_stock_afula",
        "battery_is_stock_tel_aviv", "battery_is_stock_rehovot",
        "iron_is_stock_ashdod", "storage_is_stock_netanya", "storage_is_stock_afula",
    ]
    for n in range(1, 201):
        # 8-12 string conflicts + 3-5 boolean conflicts
        s_fields = random.sample(ALL_STRING_FIELDS, random.randint(8, 12))
        b_fields = random.sample(ALL_BOOL_FIELDS, random.randint(3, 5))
        rows.append(conflict_row(n, "Salesforce", base[n], s_fields + b_fields))
    write_xlsx("large_E_salesforce_max_conflicts_200.xlsx", rows)


# ─── FILE F: Manual — 100 partial rows (stress-test sparse parsing) ──────────

def gen_large_F():
    """
    100 rows from Manual Export. Mix of:
    - Rows with only robot + 1-2 children
    - Rows with only leaf entities (no robot)
    - Rows with only wiring+storage
    - Rows with only communication+plastic+battery
    - Flying entities (no UUID, just data)
    New robots 301-400.
    """
    random.seed(105)
    rows = []

    # 30 robot-only rows (no child data, just FK stubs)
    for n in range(301, 331):
        rows.append({
            "robot_UUID":           rid(n),
            "cardboard_UUID":       cbid(n),
            "sensor_UUID":          sid(n),
            "communication_UUID":   cid(n),
            "wiring_UUID":          wid(n),
            "carrier":              random.choice(CARRIERS),
            "is_purchased":         bval(),
            "robot_district":       random.choice(DISTRICTS),
            "robot_store_name":     random.choice(STORES),
            "robot_is_stock_ashdod":    bnull(),
            "robot_is_stock_tel_aviv":  bnull(),
            "robot_is_stock_rehovot":   bnull(),
            "robot_is_stock_netanya":   None,
            "robot_is_stock_afula":     None,
            "notes": note(),
            "source": "Manual",
            "source_time": SOURCES["Manual"],
        })

    # 20 wiring+storage only (no robot)
    for n in range(331, 351):
        rows.append({
            "wiring_UUID":          wid(n),
            "wiring_type":          random.choice(WIRING_TYPES),
            "wiring_district":      random.choice(WIRING_DIST),
            "wiring_store_name":    random.choice(WIRING_STORES),
            "storage_UUID":         stid(n),
            "storage_type":         random.choice(STORAGE_TYPES),
            "storage_version":      random.choice(STORAGE_VERS),
            "storage_is_stock_netanya": bval(),
            "storage_is_stock_afula":   bval(),
            "notes": note(),
            "source": "Manual",
            "source_time": SOURCES["Manual"],
        })

    # 20 communication+plastic+battery only
    for n in range(351, 371):
        rows.append({
            "communication_UUID":   cid(n),
            "communication_type":   random.choice(COMM_TYPES),
            "plastic_UUID":         pid(n),
            "plastic_type":         random.choice(PLASTIC_TYPES),
            "battery_UUID":         bid(n),
            "sku":                  f"MAN-{n:05d}",
            "battery_type":         random.choice(BATTERY_TYPES),
            "battery_version":      random.choice(BATTERY_VERS),
            "lithium_version":      random.choice(LI_VERS),
            "battery_name":         random.choice(BATTERY_NAMES),
            "sales_person":         random.choice(SALES_PERSONS),
            "battery_is_stock_tel_aviv": bval(),
            "battery_is_stock_rehovot":  bval(),
            "notes": note(),
            "source": "Manual",
            "source_time": SOURCES["Manual"],
        })

    # 20 sensor+cardboard only
    for n in range(371, 391):
        rows.append({
            "sensor_UUID":          sid(n),
            "sensor_type":          random.choice(SENSOR_TYPES),
            "sensor_version":       random.choice(SENSOR_VERS),
            "cardboard_UUID":       cbid(n),
            "cardboard_type":       random.choice(CB_TYPES),
            "cardboard_version":    random.choice(CB_VERS),
            "notes": note(),
            "source": "Manual",
            "source_time": SOURCES["Manual"],
        })

    # 10 flying entities — no UUID at all, just data (flying entity test)
    for n in range(391, 401):
        rows.append({
            # no robot_UUID — parser creates flying entity
            "carrier":              random.choice(CARRIERS),
            "robot_district":       random.choice(DISTRICTS),
            "sensor_type":          random.choice(SENSOR_TYPES),
            "sensor_version":       random.choice(SENSOR_VERS),
            "battery_type":         random.choice(BATTERY_TYPES),
            "storage_type":         random.choice(STORAGE_TYPES),
            "notes": "Flying entity — no UUID provided",
            "source": "Manual",
            "source_time": SOURCES["Manual"],
        })

    write_xlsx("large_F_manual_partial_100.xlsx", rows)


# ─── FILE G: HQ DB — 300 rows, comprehensive, resolving and adding ────────────

def gen_large_G(base: dict):
    """
    300 rows combining:
    - Robots 1-100: light updates (1-2 field conflicts)
    - Robots 101-200: medium updates (3-4 field conflicts)
    - Robots 201-300: new SAP robots now enriched with more data
    - Robots 401-500: brand new robots (no conflicts)
    """
    random.seed(106)
    rows = []

    # Light updates on 1-100
    for n in range(1, 101):
        fields = random.sample(["carrier", "storage_type", "battery_version", "sensor_version"], 2)
        rows.append(conflict_row(n, "HQ DB", base[n], fields))

    # Medium updates on 101-200
    for n in range(101, 201):
        fields = random.sample([
            "carrier", "communication_type", "iron_type", "wiring_type",
            "battery_type", "storage_version", "robot_district",
        ], random.randint(3, 4))
        rows.append(conflict_row(n, "HQ DB", base[n], fields))

    # Enrich robots 201-300 (introduced by SAP as partial) — now fully populated
    for n in range(201, 301):
        rows.append(full_row(n, "HQ DB"))

    # 100 brand new robots
    for n in range(401, 501):
        rows.append(full_row(n, "HQ DB"))

    write_xlsx("large_G_hq_full_300.xlsx", rows)


# ─── FILE H: Audit — 200 rows, maximum conflict density, all field types ──────

def gen_large_H(base: dict):
    """
    Annual audit: all 200 base robots with conflicts on EVERY field type.
    This is the hardest stress test for conflict detection and resolution UI.
    """
    random.seed(107)
    rows = []
    ALL_FIELDS = [
        "carrier", "robot_district", "robot_store_name",
        "cardboard_type", "cardboard_version",
        "sensor_type", "sensor_version",
        "communication_type", "plastic_type",
        "battery_type", "battery_version", "lithium_version", "battery_name", "sales_person", "sku",
        "iron_type", "iron_version", "heat_conductor",
        "wiring_type", "wiring_district", "wiring_store_name",
        "storage_type", "storage_version",
        "is_purchased",
        "robot_is_stock_ashdod", "robot_is_stock_tel_aviv", "robot_is_stock_rehovot",
        "robot_is_stock_netanya", "robot_is_stock_afula",
        "battery_is_stock_tel_aviv", "battery_is_stock_rehovot",
        "iron_is_stock_ashdod", "storage_is_stock_netanya", "storage_is_stock_afula",
    ]
    for n in range(1, 201):
        # Conflict 60-80% of all fields per robot
        k = random.randint(int(len(ALL_FIELDS) * 0.6), int(len(ALL_FIELDS) * 0.8))
        fields = random.sample(ALL_FIELDS, k)
        row = conflict_row(n, "Audit 2026", base[n], fields)
        row["notes"] = f"Full audit — {k} fields revised by auditor #{random.randint(10, 99)}"
        rows.append(row)
    write_xlsx("large_H_audit_max_density_200.xlsx", rows)


# ─── FILE I: Supplier Portal — 250 rows, mix of new + FK conflicts ────────────

def gen_large_I(base: dict):
    """
    250 rows from Supplier Portal.
    - 100 existing robots with FK-level conflicts (different wiring/comm UUID for same robot)
    - 150 new robots (501-650)
    """
    random.seed(108)
    rows = []

    # FK conflicts: same robot but pointing to DIFFERENT child UUIDs
    # e.g. different wiring_UUID, communication_UUID → FK conflict
    for n in range(1, 101):
        row = base[n].copy()
        row["source"] = "Supplier Portal"
        row["source_time"] = SOURCES["Supplier Portal"]
        row["notes"] = note()
        # Change the FK UUIDs to different entities
        row["wiring_UUID"] = wid(n + 500)  # different wiring
        row["communication_UUID"] = cid(n + 500)  # different comm
        # Also change associated data
        row["wiring_type"] = random.choice(WIRING_TYPES)
        row["communication_type"] = random.choice(COMM_TYPES)
        row["carrier"] = random.choice(CARRIERS)
        rows.append(row)

    # 150 new robots
    for n in range(501, 651):
        sparse = random.choice([
            set(),  # full
            set(),  # full (more weight)
            set(),  # full
            {"cardboard_version", "sensor_version"},
            {"lithium_version", "heat_conductor"},
        ])
        rows.append(full_row(n, "Supplier Portal", sparse_mask=sparse))

    write_xlsx("large_I_supplier_portal_250.xlsx", rows)


# ─── FILE J: Legacy ERP — 300 rows, old data, creates stale conflicts ─────────

def gen_large_J(base: dict):
    """
    300 rows from Legacy ERP — simulates a bulk historical import.
    Source time is old (2025) so conflicts show time-based ordering.
    - 200 existing robots with legacy (often wrong) values
    - 100 new robots (651-750)
    """
    random.seed(109)
    rows = []

    LEGACY_CARRIERS = ["Old Freight Co", "Pre-2024 Logistics", "Archive Express", "Vintage Haul", "Retro Ship"]
    LEGACY_SENSOR  = ["Proximity", "Infrared", "Ultrasonic"]
    LEGACY_BATTERY = ["Li-Ion", "Lead Acid", "NiMH"]
    LEGACY_STORAGE = ["HDD", "SD Card", "Flash"]
    LEGACY_COMM    = ["Ethernet", "Bluetooth 5.2", "WiFi 6"]

    for n in range(1, 201):
        row = base[n].copy()
        row["source"] = "Legacy ERP"
        row["source_time"] = SOURCES["Legacy ERP"]
        row["notes"] = "Migrated from legacy system — data may be outdated"
        # Legacy always used limited value pools
        row["carrier"] = random.choice(LEGACY_CARRIERS)
        row["sensor_type"] = random.choice(LEGACY_SENSOR)
        row["battery_type"] = random.choice(LEGACY_BATTERY)
        row["storage_type"] = random.choice(LEGACY_STORAGE)
        row["communication_type"] = random.choice(LEGACY_COMM)
        row["is_purchased"] = False  # legacy default
        row["sku"] = f"LEGACY-{n:05d}"
        # Some legacy fields have None (not tracked historically)
        if random.random() < 0.3:
            row["heat_conductor"] = None
        if random.random() < 0.3:
            row["battery_name"] = None
        if random.random() < 0.4:
            row["lithium_version"] = None
        rows.append(row)

    # 100 robots only in legacy — new to system
    for n in range(651, 751):
        row = full_row(n, "Legacy ERP")
        row["source_time"] = SOURCES["Legacy ERP"]
        row["carrier"] = random.choice(LEGACY_CARRIERS)
        row["battery_type"] = random.choice(LEGACY_BATTERY)
        row["notes"] = "Legacy-only robot — first appearance in system"
        rows.append(row)

    write_xlsx("large_J_legacy_erp_300.xlsx", rows)


# ─── Run all ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generating large durability test xlsx files...\n")
    base = gen_large_A()
    gen_large_B(base)
    gen_large_C(base)
    gen_large_D(base)
    gen_large_E(base)
    gen_large_F()
    gen_large_G(base)
    gen_large_H(base)
    gen_large_I(base)
    gen_large_J(base)

    total_rows = 200 + 200 + 200 + 250 + 200 + 100 + 300 + 200 + 250 + 300
    print(f"\nDone. 10 files, {total_rows} total rows.")
    print("\nRecommended upload order (each file conflicts against earlier ones):")
    print("  1. large_A  - 200 rows  - CRM base data (robots 1-200)")
    print("  2. large_B  - 200 rows  - ERP string conflicts on all 200")
    print("  3. large_C  - 200 rows  - WMS boolean conflicts on all 200")
    print("  4. large_D  - 250 rows  - SAP: conflicts on 1-150 + new 201-300")
    print("  5. large_E  - 200 rows  - Salesforce: max conflict density on 1-200")
    print("  6. large_F  - 100 rows  - Manual: partial/sparse/flying entities")
    print("  7. large_G  - 300 rows  - HQ DB: updates + new 401-500")
    print("  8. large_H  - 200 rows  - Audit: 60-80% field conflicts on 1-200")
    print("  9. large_I  - 250 rows  - Supplier Portal: FK conflicts + new 501-650")
    print(" 10. large_J  - 300 rows  - Legacy ERP: stale conflicts + new 651-750")
    print("\nBy the end: 750 unique robots, ~5000+ conflict records generated.")
