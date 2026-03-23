# Conflict Test Seed Data

These 3 CSV files produce all 4 conflict types on the same entity — `comm-test-001` in the `communications` table — for testing the conflicts page UI.

## Upload order (use the robot template)

### seed_01.csv — Initial state (source: ERP)
Creates the full hierarchy:
- robot-test-001 → comm-test-001 (Bluetooth) → plastic-test-001 (ABS) / battery-test-001 / iron-test-001 (Cast)
- Also creates: cardboard-test-001, sensor-test-001, wiring-test-001, storage-test-001, sale-test-001

**Expected result:** 0 conflicts.

---

### seed_02.csv — Trigger VALUE + 2× TWO_CHILDS (source: CRM)
Same robot, same comm, different values:
- communicationType: WiFi (was Bluetooth) → **VALUE conflict** on comm-test-001
- plastic: plastic-test-002 / battery-test-002 (was plastic-test-001) → **TWO_CHILDS** on comm-test-001 (plasticId)
- iron: iron-test-002 (was iron-test-001) → **TWO_CHILDS** on comm-test-001 (ironId)

**Expected result:** 3 conflicts on comm-test-001.

---

### seed_03.csv — Add 3rd iron option + TWO_FATHERS (source: WMS)
Two rows:
1. robot-test-001 + comm-test-001 + iron-test-003 → **TWO_CHILDS** on comm-test-001 (ironId), adding a 3rd competing iron
2. robot-test-002 + comm-test-001 → robot-test-002 claims an already-owned comm → **TWO_FATHERS** on comm-test-001

**Expected result:** 5 open conflicts on comm-test-001:
| Type | Column | Options |
|------|--------|---------|
| VALUE | communicationType | Bluetooth (ERP) vs WiFi (CRM) |
| TWO_CHILDS | plasticId | plastic-test-001 vs plastic-test-002 |
| TWO_CHILDS | ironId | iron-test-001 vs iron-test-002 vs iron-test-003 |
| TWO_FATHERS | — | robot-test-001 vs robot-test-002 competing for comm-test-001 |
