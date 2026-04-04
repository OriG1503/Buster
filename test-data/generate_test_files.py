"""
Generates 10 test xlsx files for the Buster app covering:
- All entity types
- Cross-file robot hierarchies (robot built across multiple uploads)
- All conflict types (string, boolean, FK)
- Partial rows / fictive intermediate entities
- Varying sources, sourceTimes, notes
"""

import csv
from pathlib import Path
from typing import Optional
import random

OUT_DIR = Path(__file__).parent / "csv"
OUT_DIR.mkdir(exist_ok=True)

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

# ─── Shared ID pools ─────────────────────────────────────────────────────────

def rid(n): return f"robot-alpha-{n:03d}"
def rbid(n): return f"robot-beta-{n:03d}"
def rgid(n): return f"robot-gamma-{n:03d}"
def rdid(n): return f"robot-delta-{n:03d}"
def sid(n): return f"sens-{n:03d}"
def cbid(n): return f"cb-{n:03d}"
def cid(n): return f"comm-{n:03d}"
def pid(n): return f"plast-{n:03d}"
def bid(n): return f"batt-{n:03d}"
def iid(n): return f"iron-{n:03d}"
def wid(n): return f"wir-{n:03d}"
def stid(n): return f"stor-{n:03d}"

CARRIERS = ["DHL", "FedEx", "UPS", "Israel Post", "Maersk", "ZIM", "DB Schenker", "TNT"]
ROBOT_DISTRICTS = ["North", "South", "Center", "Haifa Bay", "Jerusalem", "Tel Aviv", "Negev", "Galilee"]
STORE_NAMES = ["Main Warehouse", "Branch A", "Branch B", "Factory Floor", "Depot North", "Depot South", "HQ Store"]
SENSOR_TYPES = ["LiDAR", "Ultrasonic", "Infrared", "Camera", "Radar", "Thermal", "Proximity"]
SENSOR_VERSIONS = ["v1.0", "v1.1", "v2.0", "v2.1", "v3.0", "v3.1", "v4.0"]
CARDBOARD_TYPES = ["Single Wall", "Double Wall", "Triple Wall", "Micro Flute", "Kraft Brown"]
CARDBOARD_VERSIONS = ["rev-A", "rev-B", "rev-C", "2024", "2025", "2026"]
COMM_TYPES = ["WiFi 6", "5G", "Bluetooth 5.2", "Zigbee", "LoRa", "Ethernet", "CAN Bus"]
PLASTIC_TYPES = ["ABS", "PVC", "Polycarbonate", "Nylon", "PEEK", "HDPE", "Polypropylene"]
BATTERY_TYPES = ["Li-Ion", "LiFePO4", "NiMH", "Solid State", "Li-Polymer", "Lead Acid"]
BATTERY_VERSIONS = ["gen1", "gen2", "gen3", "2024-A", "2024-B", "2025-A"]
LITHIUM_VERSIONS = ["LiV1", "LiV2", "LiV3", "LiV4", "NMC-1", "NMC-2", "LFP-1"]
BATTERY_NAMES = ["PowerCell A", "PowerCell B", "MegaCell", "UltraCell", "RoboPower", "InduCell", "HeavyDuty"]
SALES_PERSONS = ["Avi Cohen", "Tamar Levi", "Yossi Bar", "Dana Mizrahi", "Roi Shapiro", "Noa Klein", "Eran Peretz"]
IRON_TYPES = ["Cast Iron", "Wrought Iron", "Steel Alloy", "Stainless", "Galvanized", "Carbon Steel"]
IRON_VERSIONS = ["v1", "v2", "v3", "2024", "2025", "A-grade", "B-grade"]
HEAT_CONDUCTORS = ["Copper", "Aluminum", "Silver", "Graphene", "Thermal Paste", "None"]
WIRING_TYPES = ["12V DC", "24V DC", "48V DC", "AC 220V", "CAN Bus", "Ethernet Cat6", "Fiber Optic"]
WIRING_DISTRICTS = ["Industrial Zone A", "Industrial Zone B", "Factory District", "Port Area", "R&D Campus"]
WIRING_STORES = ["Cable Depot", "Wiring Hub", "Assembly Line Store", "Component Store", "Main Store"]
STORAGE_TYPES = ["SSD", "HDD", "Flash", "NVME", "eMMC", "SD Card", "Industrial SSD"]
STORAGE_VERSIONS = ["v1.0", "v2.0", "v3.0", "2024", "2025", "Pro", "Standard"]

SOURCES_1 = ["CRM", "ERP", "WMS", "Supplier Portal", "Manual Export", "Field Report", "HQ Database", "Legacy ERP", "Annual Audit", "Battery Vendor"]
SOURCE_TIMES = [
    "2025-11-01T08:00:00Z", "2025-11-15T10:30:00Z", "2025-12-01T09:00:00Z",
    "2026-01-10T14:00:00Z", "2026-01-20T11:00:00Z", "2026-02-05T16:30:00Z",
    "2026-02-20T08:45:00Z", "2026-03-01T13:00:00Z", "2026-03-15T09:30:00Z",
    "2026-03-25T12:00:00Z", "2026-04-01T07:00:00Z", "2026-04-03T15:00:00Z",
]

NOTES_POOL = [
    "Verified by QA team",
    "Updated after site visit",
    "Imported from legacy system",
    "Manual correction applied",
    "Pending physical verification",
    "Approved by field engineer",
    "Cross-referenced with supplier invoice",
    "Data from quarterly audit",
    "Automated sync — not verified",
    "Priority item — fast track",
    None, None, None,  # some rows have no notes
]

def rand_note(): return random.choice(NOTES_POOL)
def rand_time(): return random.choice(SOURCE_TIMES)
def rand_bool(): return random.choice([True, False, None, None])
def rand_bool_val(): return random.choice([True, False])

# ─── Column definitions ───────────────────────────────────────────────────────

ALL_COLS = [
    # Robot
    "robot_UUID", "cardboard_UUID", "sensor_UUID", "communication_UUID", "wiring_UUID",
    "carrier", "is_purchased", "robot_district", "robot_store_name",
    "robot_is_stock_ashdod", "robot_is_stock_tel_aviv", "robot_is_stock_rehovot",
    "robot_is_stock_netanya", "robot_is_stock_afula",
    # Cardboard
    "cardboard_type", "cardboard_version",
    # Sensor
    "sensor_type", "sensor_version",
    # Communication
    "communication_type", "plastic_UUID", "iron_UUID",
    # Plastic
    "plastic_type", "battery_UUID",
    # Battery
    "sku", "battery_type", "battery_version", "lithium_version", "battery_name",
    "sales_person", "battery_is_stock_tel_aviv", "battery_is_stock_rehovot",
    # Iron
    "iron_type", "iron_version", "heat_conductor", "iron_is_stock_ashdod",
    # Wiring
    "wiring_type", "wiring_district", "wiring_store_name", "storage_UUID",
    # Storage
    "storage_type", "storage_version", "storage_is_stock_netanya", "storage_is_stock_afula",
    # Meta (global per row — all entities in the row get same source/time/notes)
    "notes", "source", "source_time",
]

BATTERY_COLS = [
    "battery_UUID", "sku", "battery_type", "battery_version", "lithium_version",
    "battery_name", "sales_person", "battery_is_stock_tel_aviv", "battery_is_stock_rehovot",
    "notes", "source", "source_time",
]

SENSOR_COLS = [
    "sensor_UUID", "sensor_type", "sensor_version",
    "cardboard_UUID", "cardboard_type", "cardboard_version",
    "notes", "source", "source_time",
]

COMM_COLS = [
    "communication_UUID", "communication_type", "plastic_UUID", "iron_UUID",
    "plastic_type", "battery_UUID",
    "iron_type", "iron_version", "heat_conductor", "iron_is_stock_ashdod",
    "notes", "source", "source_time",
]

ROBOT_ONLY_COLS = [
    "robot_UUID", "cardboard_UUID", "sensor_UUID", "communication_UUID", "wiring_UUID",
    "carrier", "is_purchased", "robot_district", "robot_store_name",
    "robot_is_stock_ashdod", "robot_is_stock_tel_aviv", "robot_is_stock_rehovot",
    "robot_is_stock_netanya", "robot_is_stock_afula",
    "notes", "source", "source_time",
]

WIRING_STORAGE_COLS = [
    "wiring_UUID", "wiring_type", "wiring_district", "wiring_store_name", "storage_UUID",
    "storage_type", "storage_version", "storage_is_stock_netanya", "storage_is_stock_afula",
    "notes", "source", "source_time",
]

# ─── Writer helper ────────────────────────────────────────────────────────────

def write_xlsx(filename: str, cols: list, rows: list[dict]):
    path = OUT_DIR / filename.replace('.xlsx', '.csv')
    hebrew_headers = [PARSER_TO_HEBREW[col] for col in cols]
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(hebrew_headers)
        for row in rows:
            writer.writerow([row.get(col) for col in cols])
    print(f"  Saved: {path.name}  ({len(rows)} rows)")


# ─── Data builders ────────────────────────────────────────────────────────────

def full_row(robot_n: int, source: str, source_time: str, notes: Optional[str] = None, overrides: dict = None) -> dict:
    """Build a fully populated hierarchy row for robot-alpha-N."""
    row = {
        "robot_UUID": rid(robot_n),
        "cardboard_UUID": cbid(robot_n),
        "sensor_UUID": sid(robot_n),
        "communication_UUID": cid(robot_n),
        "wiring_UUID": wid(robot_n),
        "carrier": random.choice(CARRIERS),
        "is_purchased": rand_bool_val(),
        "robot_district": random.choice(ROBOT_DISTRICTS),
        "robot_store_name": random.choice(STORE_NAMES),
        "robot_is_stock_ashdod": rand_bool_val(),
        "robot_is_stock_tel_aviv": rand_bool_val(),
        "robot_is_stock_rehovot": rand_bool_val(),
        "robot_is_stock_netanya": rand_bool_val(),
        "robot_is_stock_afula": rand_bool_val(),
        "cardboard_type": random.choice(CARDBOARD_TYPES),
        "cardboard_version": random.choice(CARDBOARD_VERSIONS),
        "sensor_type": random.choice(SENSOR_TYPES),
        "sensor_version": random.choice(SENSOR_VERSIONS),
        "communication_type": random.choice(COMM_TYPES),
        "plastic_UUID": pid(robot_n),
        "iron_UUID": iid(robot_n),
        "plastic_type": random.choice(PLASTIC_TYPES),
        "battery_UUID": bid(robot_n),
        "sku": f"SKU-{robot_n:04d}-{random.randint(100,999)}",
        "battery_type": random.choice(BATTERY_TYPES),
        "battery_version": random.choice(BATTERY_VERSIONS),
        "lithium_version": random.choice(LITHIUM_VERSIONS),
        "battery_name": random.choice(BATTERY_NAMES),
        "sales_person": random.choice(SALES_PERSONS),
        "battery_is_stock_tel_aviv": rand_bool_val(),
        "battery_is_stock_rehovot": rand_bool_val(),
        "iron_type": random.choice(IRON_TYPES),
        "iron_version": random.choice(IRON_VERSIONS),
        "heat_conductor": random.choice(HEAT_CONDUCTORS),
        "iron_is_stock_ashdod": rand_bool_val(),
        "wiring_type": random.choice(WIRING_TYPES),
        "wiring_district": random.choice(WIRING_DISTRICTS),
        "wiring_store_name": random.choice(WIRING_STORES),
        "storage_UUID": stid(robot_n),
        "storage_type": random.choice(STORAGE_TYPES),
        "storage_version": random.choice(STORAGE_VERSIONS),
        "storage_is_stock_netanya": rand_bool_val(),
        "storage_is_stock_afula": rand_bool_val(),
        "notes": notes,
        "source": source,
        "source_time": source_time,
    }
    if overrides:
        row.update(overrides)
    return row


# ─── FILE 1: CRM — Full hierarchy, 25 complete rows ──────────────────────────

def gen_file_01():
    random.seed(1)
    rows = []
    for n in range(1, 26):
        rows.append(full_row(n, "CRM", "2026-01-15T09:00:00Z", rand_note()))
    write_xlsx("file_01_crm_full_hierarchy.xlsx", ALL_COLS, rows)


# ─── FILE 2: ERP — Same robots (1-15) + 10 new (26-35), conflicting values ───

def gen_file_02():
    random.seed(2)
    rows = []
    # Robots 1-15: same UUIDs but different carrier, battery_type, comm_type → conflicts with file 1
    for n in range(1, 16):
        row = full_row(n, "ERP", "2026-02-01T10:00:00Z", rand_note())
        # Force different values to guarantee conflicts
        erp_carriers = [c for c in CARRIERS if c != row["carrier"]]
        row["carrier"] = random.choice(erp_carriers) if erp_carriers else "TNT"
        erp_btypes = [b for b in BATTERY_TYPES if b != row["battery_type"]]
        row["battery_type"] = random.choice(erp_btypes) if erp_btypes else "Li-Polymer"
        erp_ctypes = [c for c in COMM_TYPES if c != row["communication_type"]]
        row["communication_type"] = random.choice(erp_ctypes) if erp_ctypes else "5G"
        erp_stypes = [s for s in STORAGE_TYPES if s != row["storage_type"]]
        row["storage_type"] = random.choice(erp_stypes) if erp_stypes else "NVMe"
        rows.append(row)
    # Robots 26-35: new robots from ERP only (no conflict yet, fresh data)
    for n in range(26, 36):
        rows.append(full_row(n, "ERP", "2026-02-01T10:00:00Z", rand_note()))
    write_xlsx("file_02_erp_conflicts.xlsx", ALL_COLS, rows)


# ─── FILE 3: WMS — Stock boolean conflicts on robots 1-15 + 10 more ──────────

def gen_file_03():
    random.seed(3)
    rows = []
    # Robots 1-15: same UUIDs, flip stock booleans and change district/store → boolean conflicts
    for n in range(1, 16):
        row = full_row(n, "WMS", "2026-02-20T08:00:00Z", rand_note())
        # Deliberately invert booleans to guarantee conflicts with file 1
        row["robot_is_stock_ashdod"] = not row["robot_is_stock_ashdod"]
        row["robot_is_stock_tel_aviv"] = not row["robot_is_stock_tel_aviv"]
        row["storage_is_stock_netanya"] = not row["storage_is_stock_netanya"]
        row["battery_is_stock_tel_aviv"] = not row["battery_is_stock_tel_aviv"]
        row["robot_district"] = random.choice([d for d in ROBOT_DISTRICTS if d != row["robot_district"]])
        rows.append(row)
    # Robots 36-45: new robots in WMS (no conflicts)
    for n in range(36, 46):
        rows.append(full_row(n, "WMS", "2026-02-20T08:00:00Z", rand_note()))
    write_xlsx("file_03_wms_stock_update.xlsx", ALL_COLS, rows)


# ─── FILE 4: Battery Vendor — Battery-only rows (leaf), 28 rows ───────────────

def gen_file_04():
    random.seed(4)
    rows = []
    # Batteries 50-77 — standalone, referenced by gamma robots later
    for n in range(50, 78):
        rows.append({
            "battery_UUID": bid(n),
            "sku": f"BV-SKU-{n:04d}",
            "battery_type": random.choice(BATTERY_TYPES),
            "battery_version": random.choice(BATTERY_VERSIONS),
            "lithium_version": random.choice(LITHIUM_VERSIONS),
            "battery_name": random.choice(BATTERY_NAMES),
            "sales_person": random.choice(SALES_PERSONS),
            "battery_is_stock_tel_aviv": rand_bool_val(),
            "battery_is_stock_rehovot": rand_bool_val(),
            "notes": rand_note(),
            "source": "Battery Vendor",
            "source_time": rand_time(),
        })
    write_xlsx("file_04_battery_vendor.xlsx", BATTERY_COLS, rows)


# ─── FILE 5: Sensor Supplier — Sensor+Cardboard rows, 26 rows ────────────────

def gen_file_05():
    random.seed(5)
    rows = []
    # Sensors 50-75 with paired cardboards 50-75
    for n in range(50, 76):
        rows.append({
            "sensor_UUID": sid(n),
            "sensor_type": random.choice(SENSOR_TYPES),
            "sensor_version": random.choice(SENSOR_VERSIONS),
            "cardboard_UUID": cbid(n),
            "cardboard_type": random.choice(CARDBOARD_TYPES),
            "cardboard_version": random.choice(CARDBOARD_VERSIONS),
            "notes": rand_note(),
            "source": "Sensor Supplier",
            "source_time": rand_time(),
        })
    write_xlsx("file_05_sensor_supplier.xlsx", SENSOR_COLS, rows)


# ─── FILE 6: Comm Manufacturer — Comm+Iron+Plastic rows, 27 rows ─────────────

def gen_file_06():
    random.seed(6)
    rows = []
    # Comms 50-76 with iron and plastic
    for n in range(50, 77):
        rows.append({
            "communication_UUID": cid(n),
            "communication_type": random.choice(COMM_TYPES),
            "plastic_UUID": pid(n),
            "iron_UUID": iid(n),
            "plastic_type": random.choice(PLASTIC_TYPES),
            "battery_UUID": bid(n + 50),  # point to batteries that don't exist yet (will be fictive or conflict)
            "iron_type": random.choice(IRON_TYPES),
            "iron_version": random.choice(IRON_VERSIONS),
            "heat_conductor": random.choice(HEAT_CONDUCTORS),
            "iron_is_stock_ashdod": rand_bool_val(),
            "notes": rand_note(),
            "source": "Comm Manufacturer",
            "source_time": rand_time(),
        })
    write_xlsx("file_06_comm_manufacturer.xlsx", COMM_COLS, rows)


# ─── FILE 7: Field Report — Partial robot rows (beta robots), fictive scenario ─

def gen_file_07():
    random.seed(7)
    rows = []
    # Beta robots 1-10: have robot + sensor + cardboard, but NO wiring_UUID → fictive wiring
    for n in range(1, 11):
        rows.append({
            "robot_UUID": rbid(n),
            "cardboard_UUID": cbid(n + 50),
            "sensor_UUID": sid(n + 50),
            "communication_UUID": cid(n + 50),
            # wiring_UUID intentionally omitted → will generate fictive wiring
            "carrier": random.choice(CARRIERS),
            "is_purchased": rand_bool_val(),
            "robot_district": random.choice(ROBOT_DISTRICTS),
            "robot_store_name": random.choice(STORE_NAMES),
            "robot_is_stock_ashdod": rand_bool_val(),
            "robot_is_stock_tel_aviv": rand_bool_val(),
            "robot_is_stock_rehovot": rand_bool_val(),
            "robot_is_stock_netanya": rand_bool_val(),
            "robot_is_stock_afula": rand_bool_val(),
            "cardboard_type": random.choice(CARDBOARD_TYPES),
            "cardboard_version": random.choice(CARDBOARD_VERSIONS),
            "sensor_type": random.choice(SENSOR_TYPES),
            "sensor_version": random.choice(SENSOR_VERSIONS),
            "communication_type": random.choice(COMM_TYPES),
            "plastic_UUID": pid(n + 50),
            "iron_UUID": iid(n + 50),
            "plastic_type": random.choice(PLASTIC_TYPES),
            # battery_UUID omitted → fictive battery linked via plastic
            "iron_type": random.choice(IRON_TYPES),
            "iron_version": random.choice(IRON_VERSIONS),
            "heat_conductor": random.choice(HEAT_CONDUCTORS),
            "iron_is_stock_ashdod": rand_bool_val(),
            # storage_UUID omitted → fictive storage linked via wiring
            "notes": rand_note(),
            "source": "Field Report",
            "source_time": "2026-03-10T07:30:00Z",
        })
    # Beta robots 11-20: have robot data only (no child data at all) — just FK stubs
    for n in range(11, 21):
        rows.append({
            "robot_UUID": rbid(n),
            # all FK UUIDs missing — robot is alone in hierarchy
            "carrier": random.choice(CARRIERS),
            "is_purchased": rand_bool_val(),
            "robot_district": random.choice(ROBOT_DISTRICTS),
            "robot_store_name": random.choice(STORE_NAMES),
            "robot_is_stock_ashdod": rand_bool(),
            "robot_is_stock_tel_aviv": rand_bool(),
            "robot_is_stock_rehovot": rand_bool(),
            "robot_is_stock_netanya": None,
            "robot_is_stock_afula": None,
            "notes": rand_note(),
            "source": "Field Report",
            "source_time": "2026-03-10T07:30:00Z",
        })
    # 5 extra rows with no robot_UUID but have battery + storage data → flying entities
    for n in range(21, 26):
        rows.append({
            # no robot_UUID — flying entity test
            "wiring_UUID": wid(n + 50),
            "wiring_type": random.choice(WIRING_TYPES),
            "wiring_district": random.choice(WIRING_DISTRICTS),
            "wiring_store_name": random.choice(WIRING_STORES),
            "storage_UUID": stid(n + 50),
            "storage_type": random.choice(STORAGE_TYPES),
            "storage_version": random.choice(STORAGE_VERSIONS),
            "storage_is_stock_netanya": rand_bool_val(),
            "storage_is_stock_afula": rand_bool_val(),
            "notes": rand_note(),
            "source": "Field Report",
            "source_time": "2026-03-10T07:30:00Z",
        })
    write_xlsx("file_07_field_report_partial.xlsx", ALL_COLS, rows)


# ─── FILE 8: Annual Audit — Conflicts on alpha robots 1-10 + 16 new ──────────

def gen_file_08():
    random.seed(8)
    rows = []
    # Robots 1-10: heavily audited, many field changes → lots of conflicts with files 1+2+3
    AUDIT_CARRIERS = ["Air France Cargo", "Lufthansa Cargo", "El Al Cargo", "Swiss Air Cargo"]
    AUDIT_COMM_TYPES = ["LoRaWAN", "NB-IoT", "Sigfox", "RPMA", "Weightless"]
    AUDIT_BATTERY_TYPES = ["Solid State", "Li-Air", "Zinc-Air", "Sodium-Ion"]
    AUDIT_SENSOR_TYPES = ["Quantum Sensor", "MEMS Gyro", "Ultrasonic v2", "AI Camera", "Stereo Camera"]
    for n in range(1, 11):
        rows.append({
            "robot_UUID": rid(n),
            "cardboard_UUID": cbid(n),
            "sensor_UUID": sid(n),
            "communication_UUID": cid(n),
            "wiring_UUID": wid(n),
            "carrier": random.choice(AUDIT_CARRIERS),  # different from CRM/ERP
            "is_purchased": rand_bool_val(),
            "robot_district": "Audit Zone",  # changed
            "robot_store_name": "Audit Depot",  # changed
            "robot_is_stock_ashdod": rand_bool_val(),
            "robot_is_stock_tel_aviv": rand_bool_val(),
            "robot_is_stock_rehovot": rand_bool_val(),
            "robot_is_stock_netanya": rand_bool_val(),
            "robot_is_stock_afula": rand_bool_val(),
            "cardboard_type": random.choice(CARDBOARD_TYPES),
            "cardboard_version": "AUDIT-2026",  # always different
            "sensor_type": random.choice(AUDIT_SENSOR_TYPES),  # different types
            "sensor_version": "AUDIT-v5",
            "communication_type": random.choice(AUDIT_COMM_TYPES),  # different
            "plastic_UUID": pid(n),
            "iron_UUID": iid(n),
            "plastic_type": random.choice(PLASTIC_TYPES),
            "battery_UUID": bid(n),
            "sku": f"AUDIT-{n:04d}",  # different SKU
            "battery_type": random.choice(AUDIT_BATTERY_TYPES),  # different
            "battery_version": "AUDIT-2026",
            "lithium_version": "AUDIT-Li",
            "battery_name": f"AuditCell-{n}",
            "sales_person": "Audit System",
            "battery_is_stock_tel_aviv": not rand_bool_val(),  # inverted
            "battery_is_stock_rehovot": not rand_bool_val(),
            "iron_type": random.choice(IRON_TYPES),
            "iron_version": "AUDIT-v1",
            "heat_conductor": random.choice(HEAT_CONDUCTORS),
            "iron_is_stock_ashdod": rand_bool_val(),
            "wiring_type": random.choice(WIRING_TYPES),
            "wiring_district": "Audit Industrial Zone",
            "wiring_store_name": "Audit Cable Store",
            "storage_UUID": stid(n),
            "storage_type": random.choice(STORAGE_TYPES),
            "storage_version": "AUDIT-2026",
            "storage_is_stock_netanya": rand_bool_val(),
            "storage_is_stock_afula": rand_bool_val(),
            "notes": f"Annual audit 2026 — verified by field inspector #{n+100}",
            "source": "Annual Audit 2026",
            "source_time": "2026-04-01T09:00:00Z",
        })
    # 16 new robots from audit (46-61)
    for n in range(46, 62):
        rows.append(full_row(n, "Annual Audit 2026", "2026-04-01T09:00:00Z", rand_note()))
    write_xlsx("file_08_annual_audit.xlsx", ALL_COLS, rows)


# ─── FILE 9: HQ Completion — Completes beta + introduces gamma robots ─────────

def gen_file_09():
    random.seed(9)
    rows = []
    # Complete beta robots 1-10: add the missing wiring + storage + battery
    for n in range(1, 11):
        rows.append({
            "robot_UUID": rbid(n),
            "wiring_UUID": wid(n + 50),  # now provided
            "storage_UUID": stid(n + 50),  # now provided
            "battery_UUID": bid(n + 50),  # now provided
            "wiring_type": random.choice(WIRING_TYPES),
            "wiring_district": random.choice(WIRING_DISTRICTS),
            "wiring_store_name": random.choice(WIRING_STORES),
            "storage_type": random.choice(STORAGE_TYPES),
            "storage_version": random.choice(STORAGE_VERSIONS),
            "storage_is_stock_netanya": rand_bool_val(),
            "storage_is_stock_afula": rand_bool_val(),
            "sku": f"HQ-SKU-{n:04d}",
            "battery_type": random.choice(BATTERY_TYPES),
            "battery_version": random.choice(BATTERY_VERSIONS),
            "lithium_version": random.choice(LITHIUM_VERSIONS),
            "battery_name": random.choice(BATTERY_NAMES),
            "sales_person": random.choice(SALES_PERSONS),
            "battery_is_stock_tel_aviv": rand_bool_val(),
            "battery_is_stock_rehovot": rand_bool_val(),
            "notes": "HQ completion update — missing components supplied",
            "source": "HQ Database",
            "source_time": "2026-04-02T11:00:00Z",
        })
    # Update beta robots 11-20: add full child hierarchy
    for n in range(11, 21):
        rows.append({
            "robot_UUID": rbid(n),
            "cardboard_UUID": cbid(n + 60),
            "sensor_UUID": sid(n + 60),
            "communication_UUID": cid(n + 60),
            "wiring_UUID": wid(n + 60),
            "cardboard_type": random.choice(CARDBOARD_TYPES),
            "cardboard_version": random.choice(CARDBOARD_VERSIONS),
            "sensor_type": random.choice(SENSOR_TYPES),
            "sensor_version": random.choice(SENSOR_VERSIONS),
            "communication_type": random.choice(COMM_TYPES),
            "plastic_UUID": pid(n + 60),
            "iron_UUID": iid(n + 60),
            "plastic_type": random.choice(PLASTIC_TYPES),
            "battery_UUID": bid(n + 60),
            "sku": f"HQ-SKU-{n+60:04d}",
            "battery_type": random.choice(BATTERY_TYPES),
            "battery_version": random.choice(BATTERY_VERSIONS),
            "lithium_version": random.choice(LITHIUM_VERSIONS),
            "battery_name": random.choice(BATTERY_NAMES),
            "sales_person": random.choice(SALES_PERSONS),
            "battery_is_stock_tel_aviv": rand_bool_val(),
            "battery_is_stock_rehovot": rand_bool_val(),
            "iron_type": random.choice(IRON_TYPES),
            "iron_version": random.choice(IRON_VERSIONS),
            "heat_conductor": random.choice(HEAT_CONDUCTORS),
            "iron_is_stock_ashdod": rand_bool_val(),
            "wiring_type": random.choice(WIRING_TYPES),
            "wiring_district": random.choice(WIRING_DISTRICTS),
            "wiring_store_name": random.choice(WIRING_STORES),
            "storage_UUID": stid(n + 60),
            "storage_type": random.choice(STORAGE_TYPES),
            "storage_version": random.choice(STORAGE_VERSIONS),
            "storage_is_stock_netanya": rand_bool_val(),
            "storage_is_stock_afula": rand_bool_val(),
            "notes": rand_note(),
            "source": "HQ Database",
            "source_time": "2026-04-02T11:00:00Z",
        })
    # Gamma robots 1-7: full hierarchy using batteries from file_04 and sensors from file_05
    for n in range(1, 8):
        rows.append({
            "robot_UUID": rgid(n),
            "cardboard_UUID": cbid(n + 50),  # from file_05
            "sensor_UUID": sid(n + 50),       # from file_05
            "communication_UUID": cid(n + 50),  # from file_06
            "wiring_UUID": wid(n + 75),
            "carrier": random.choice(CARRIERS),
            "is_purchased": rand_bool_val(),
            "robot_district": random.choice(ROBOT_DISTRICTS),
            "robot_store_name": random.choice(STORE_NAMES),
            "robot_is_stock_ashdod": rand_bool_val(),
            "robot_is_stock_tel_aviv": rand_bool_val(),
            "robot_is_stock_rehovot": rand_bool_val(),
            "robot_is_stock_netanya": rand_bool_val(),
            "robot_is_stock_afula": rand_bool_val(),
            # sensor/cardboard data already in DB from file 05 — don't repeat to test FK-only reference
            "storage_UUID": stid(n + 75),
            "storage_type": random.choice(STORAGE_TYPES),
            "storage_version": random.choice(STORAGE_VERSIONS),
            "storage_is_stock_netanya": rand_bool_val(),
            "storage_is_stock_afula": rand_bool_val(),
            "wiring_type": random.choice(WIRING_TYPES),
            "wiring_district": random.choice(WIRING_DISTRICTS),
            "wiring_store_name": random.choice(WIRING_STORES),
            "notes": "Gamma robot — components pre-loaded from vendor files",
            "source": "HQ Database",
            "source_time": "2026-04-02T11:00:00Z",
        })
    write_xlsx("file_09_hq_completion.xlsx", ALL_COLS, rows)


# ─── FILE 10: Legacy ERP — Mixed, all types, heavy conflict generation ────────

def gen_file_10():
    random.seed(10)
    rows = []
    LEGACY_SOURCE = "Legacy ERP"
    LEGACY_TIME = "2025-06-01T06:00:00Z"  # old timestamp

    # Delta robots 1-10: brand new, full hierarchy (no conflicts)
    for n in range(1, 11):
        row = {
            "robot_UUID": rdid(n),
            "cardboard_UUID": cbid(n + 80),
            "sensor_UUID": sid(n + 80),
            "communication_UUID": cid(n + 80),
            "wiring_UUID": wid(n + 80),
            "carrier": random.choice(CARRIERS),
            "is_purchased": rand_bool_val(),
            "robot_district": random.choice(ROBOT_DISTRICTS),
            "robot_store_name": random.choice(STORE_NAMES),
            "robot_is_stock_ashdod": rand_bool_val(),
            "robot_is_stock_tel_aviv": rand_bool_val(),
            "robot_is_stock_rehovot": rand_bool_val(),
            "robot_is_stock_netanya": rand_bool_val(),
            "robot_is_stock_afula": rand_bool_val(),
            "cardboard_type": random.choice(CARDBOARD_TYPES),
            "cardboard_version": random.choice(CARDBOARD_VERSIONS),
            "sensor_type": random.choice(SENSOR_TYPES),
            "sensor_version": random.choice(SENSOR_VERSIONS),
            "communication_type": random.choice(COMM_TYPES),
            "plastic_UUID": pid(n + 80),
            "iron_UUID": iid(n + 80),
            "plastic_type": random.choice(PLASTIC_TYPES),
            "battery_UUID": bid(n + 80),
            "sku": f"LEG-{n:04d}",
            "battery_type": random.choice(BATTERY_TYPES),
            "battery_version": random.choice(BATTERY_VERSIONS),
            "lithium_version": random.choice(LITHIUM_VERSIONS),
            "battery_name": random.choice(BATTERY_NAMES),
            "sales_person": random.choice(SALES_PERSONS),
            "battery_is_stock_tel_aviv": rand_bool_val(),
            "battery_is_stock_rehovot": rand_bool_val(),
            "iron_type": random.choice(IRON_TYPES),
            "iron_version": random.choice(IRON_VERSIONS),
            "heat_conductor": random.choice(HEAT_CONDUCTORS),
            "iron_is_stock_ashdod": rand_bool_val(),
            "wiring_type": random.choice(WIRING_TYPES),
            "wiring_district": random.choice(WIRING_DISTRICTS),
            "wiring_store_name": random.choice(WIRING_STORES),
            "storage_UUID": stid(n + 80),
            "storage_type": random.choice(STORAGE_TYPES),
            "storage_version": random.choice(STORAGE_VERSIONS),
            "storage_is_stock_netanya": rand_bool_val(),
            "storage_is_stock_afula": rand_bool_val(),
            "notes": f"Migrated from legacy system — data may be stale",
            "source": LEGACY_SOURCE,
            "source_time": LEGACY_TIME,
        }
        rows.append(row)

    # Alpha robots 16-25: these were ERP-only, now legacy adds different values → conflicts
    LEGACY_CARRIERS = ["Old Carrier Co", "Pre-2024 Logistics", "Legacy Freight", "Archive Express"]
    for n in range(16, 26):
        row = full_row(n, LEGACY_SOURCE, LEGACY_TIME, f"Legacy record — original data from 2025")
        row["carrier"] = random.choice(LEGACY_CARRIERS)  # conflict with ERP
        row["battery_type"] = "Li-Ion"  # all legacy used Li-Ion → conflicts
        row["sensor_type"] = "Proximity"  # legacy sensor type
        row["storage_type"] = "HDD"  # legacy storage type
        row["is_purchased"] = False  # legacy default
        rows.append(row)

    # 5 rows: only wiring + storage (no robot) — leaf entity standalone uploads
    for n in range(90, 95):
        rows.append({
            "wiring_UUID": wid(n),
            "wiring_type": random.choice(WIRING_TYPES),
            "wiring_district": random.choice(WIRING_DISTRICTS),
            "wiring_store_name": random.choice(WIRING_STORES),
            "storage_UUID": stid(n),
            "storage_type": random.choice(STORAGE_TYPES),
            "storage_version": random.choice(STORAGE_VERSIONS),
            "storage_is_stock_netanya": rand_bool_val(),
            "storage_is_stock_afula": rand_bool_val(),
            "notes": "Standalone wiring/storage from legacy",
            "source": LEGACY_SOURCE,
            "source_time": LEGACY_TIME,
        })

    # 5 rows: only battery data (standalone)
    for n in range(90, 95):
        rows.append({
            "battery_UUID": bid(n),
            "sku": f"LEGACY-{n}",
            "battery_type": "Li-Ion",
            "battery_version": "legacy-v1",
            "lithium_version": "LiV1",
            "battery_name": f"LegacyCell-{n}",
            "sales_person": "Legacy System",
            "battery_is_stock_tel_aviv": rand_bool_val(),
            "battery_is_stock_rehovot": rand_bool_val(),
            "notes": "Battery migrated from legacy inventory",
            "source": LEGACY_SOURCE,
            "source_time": LEGACY_TIME,
        })

    write_xlsx("file_10_legacy_migration.xlsx", ALL_COLS, rows)


# ─── Run all ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generating test xlsx files...")
    gen_file_01()
    gen_file_02()
    gen_file_03()
    gen_file_04()
    gen_file_05()
    gen_file_06()
    gen_file_07()
    gen_file_08()
    gen_file_09()
    gen_file_10()
    print("\nDone. All files saved to test-data/xlsx/")
    print("\nUpload order for full test coverage:")
    print("  1. file_01  → establishes base data (alpha robots 1-25)")
    print("  2. file_02  → ERP conflicts on alpha 1-15, adds alpha 26-35")
    print("  3. file_03  → WMS boolean conflicts on alpha 1-15, adds alpha 36-45")
    print("  4. file_04  → standalone batteries 50-77")
    print("  5. file_05  → standalone sensors+cardboards 50-75")
    print("  6. file_06  → standalone comms+iron+plastic 50-76")
    print("  7. file_07  → partial beta robots (fictive entity test)")
    print("  8. file_08  → audit conflicts on alpha 1-10, adds alpha 46-61")
    print("  9. file_09  → completes beta robots + introduces gamma robots")
    print(" 10. file_10  → legacy migration: delta robots + conflicts on alpha 16-25")
