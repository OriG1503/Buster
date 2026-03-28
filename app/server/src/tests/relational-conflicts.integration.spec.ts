import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { DataProcessorService } from '../modules/data-processor/services/data-processor.service';
import { RelationalConflictRepository } from '../modules/entities/conflict/relational-conflict.repository';
import { ParsedRow } from '../modules/data-processor/types/parsed-row.type';
import { RELATIONAL_CONFLICT_TYPE } from '../modules/entities/conflict/consts/relational-conflict-type.const';

const TABLES_TO_TRUNCATE = [
  'relational_conflicts',
  'value_conflicts',
  'robots',
  'communications',
  'plastics',
  'wirings',
  'batteries',
  'irons',
  'storages',
  'sensors',
  'cardboards',
];

const BASE_ROW: ParsedRow = {
  robot_UUID: 'robot-test-001',
  source: 'ERP',
  notes: null,
  cardboard: {
    cardboard_UUID: 'cardboard-test-001',
    source: 'ERP',
    notes: null,
    cardboard_type: 'Standard',
    cardboard_version: 'v1',
  },
  sensor: {
    sensor_UUID: 'sensor-test-001',
    source: 'ERP',
    notes: null,
    sensor_type: 'TypeA',
    sensor_version: 'v1',
  },
  communication: {
    communication_UUID: 'comm-test-001',
    source: 'ERP',
    notes: null,
    communication_type: 'Bluetooth',
    plastic: {
      plastic_UUID: 'plastic-test-001',
      source: 'ERP',
      notes: null,
      plastic_type: 'ABS',
      battery: {
        battery_UUID: 'battery-test-001',
        source: 'ERP',
        notes: null,
        sku: 'SKU-001',
        battery_type: 'Li-Ion',
        battery_version: 'v1',
        lithium_version: 'L1',
      },
    },
    iron: {
      iron_UUID: 'iron-test-001',
      source: 'ERP',
      notes: null,
      iron_type: 'Cast',
      iron_version: 'v1',
      is_heat_conductor: 'true',
    },
  },
  wiring: {
    wiring_UUID: 'wiring-test-001',
    source: 'ERP',
    notes: null,
    wiring_type: 'Standard',
    wiring_district: 'North',
    wiring_store_name: 'Haifa',
    storage: {
      storage_UUID: 'storage-test-001',
      source: 'ERP',
      notes: null,
      storage_type: 'SSD',
      storage_version: 'v1',
      is_stock_netanya: 'true',
      is_stock_afula: 'false',
    },
  },
};

/** File 3: robot-001 now claims comm-002 (new) → expect ONE TWO_CHILDS on robots/robot-test-001. */
const TWO_CHILDS_ROW: ParsedRow = {
  ...BASE_ROW,
  source: 'WMS',
  communication: {
    communication_UUID: 'comm-test-002',
    source: 'WMS',
    notes: null,
    communication_type: 'WiFi',
    plastic: {
      plastic_UUID: 'plastic-test-002',
      source: 'WMS',
      notes: null,
      plastic_type: 'PVC',
      battery: {
        battery_UUID: 'battery-test-002',
        source: 'WMS',
        notes: null,
        sku: 'SKU-002',
        battery_type: 'NiMH',
        battery_version: 'v2',
        lithium_version: null,
      },
    },
    iron: {
      iron_UUID: 'iron-test-002',
      source: 'WMS',
      notes: null,
      iron_type: 'Alloy',
      iron_version: 'v2',
      is_heat_conductor: 'false',
    },
  },
};

describe('Relational Conflict Detection (integration)', () => {
  let dataProcessor: DataProcessorService;
  let relationalConflictRepo: RelationalConflictRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    dataProcessor = module.get(DataProcessorService);
    relationalConflictRepo = module.get(RelationalConflictRepository);
    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query(`TRUNCATE TABLE ${TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
  });

  it('file 1 (base): inserts all entities with zero relational conflicts', async () => {
    await dataProcessor.process([BASE_ROW], 'test-user');

    const conflicts = await relationalConflictRepo.findAll();
    expect(conflicts).toHaveLength(0);
  });

  it('file 3 (two_childs): creates exactly ONE TWO_CHILDS conflict on robots/robot-test-001', async () => {
    // Seed base state
    await dataProcessor.process([BASE_ROW], 'test-user');

    // Upload file 3
    await dataProcessor.process([TWO_CHILDS_ROW], 'test-user');

    const conflicts = await relationalConflictRepo.findAll();

    expect(conflicts).toHaveLength(1);

    const conflict = conflicts[0];
    expect(conflict.conflictType).toBe(RELATIONAL_CONFLICT_TYPE.TWO_CHILDS);
    expect(conflict.anchorTable).toBe('robots');
    expect(conflict.anchorId).toBe('robot-test-001');
    expect(conflict.relatedTable).toBe('communications');
    expect(conflict.oldRelatedId).toBe('comm-test-001');
    expect(conflict.newRelatedId).toBe('comm-test-002');
    expect(conflict.isSolved).toBe(false);
  });
});
