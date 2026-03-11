import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { AppModule } from '../app.module';
import { BatteryRepository } from '../modules/battery/battery.repository';
import { BatteryEntity } from '../modules/battery/entities/battery.entity';
import { CardboardRepository } from '../modules/cardboard/cardboard.repository';
import { CommunicationRepository } from '../modules/communication/communication.repository';
import { ConflictRepository } from '../modules/conflict/conflict.repository';
import { IronRepository } from '../modules/iron/iron.repository';
import { IronEntity } from '../modules/iron/entities/iron.entity';
import { PlasticRepository } from '../modules/plastic/plastic.repository';
import { PlasticEntity } from '../modules/plastic/entities/plastic.entity';
import { RobotRepository } from '../modules/robot/robot.repository';
import { RobotEntity } from '../modules/robot/entities/robot.entity';
import { SaleRepository } from '../modules/sale/sale.repository';
import { SaleEntity } from '../modules/sale/entities/sale.entity';
import { SensorRepository } from '../modules/sensor/sensor.repository';
import { SensorEntity } from '../modules/sensor/entities/sensor.entity';
import { StorageRepository } from '../modules/storage/storage.repository';
import { StorageEntity } from '../modules/storage/entities/storage.entity';
import { WiringRepository } from '../modules/wiring/wiring.repository';
import { WiringEntity } from '../modules/wiring/entities/wiring.entity';
import { CardboardEntity } from '../modules/cardboard/entities/cardboard.entity';
import { CommunicationEntity } from '../modules/communication/entities/communication.entity';

const T = 'test';

describe('Entity Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let batteryRepo: BatteryRepository;
  let storageRepo: StorageRepository;
  let ironRepo: IronRepository;
  let plasticRepo: PlasticRepository;
  let communicationRepo: CommunicationRepository;
  let wiringRepo: WiringRepository;
  let cardboardRepo: CardboardRepository;
  let sensorRepo: SensorRepository;
  let saleRepo: SaleRepository;
  let robotRepo: RobotRepository;
  let conflictRepo: ConflictRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    dataSource = module.get(DataSource);
    batteryRepo = module.get(BatteryRepository);
    storageRepo = module.get(StorageRepository);
    ironRepo = module.get(IronRepository);
    plasticRepo = module.get(PlasticRepository);
    communicationRepo = module.get(CommunicationRepository);
    wiringRepo = module.get(WiringRepository);
    cardboardRepo = module.get(CardboardRepository);
    sensorRepo = module.get(SensorRepository);
    saleRepo = module.get(SaleRepository);
    robotRepo = module.get(RobotRepository);
    conflictRepo = module.get(ConflictRepository);
  });

  afterAll(async () => {
    // Hard-delete all test data in FK dependency order
    await dataSource.query(`DELETE FROM robots WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM communications WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM wirings WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM plastics WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM batteries WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM storages WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM irons WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM cardboards WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM sensors WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM sales WHERE id LIKE '${T}-%'`);
    await dataSource.query(`DELETE FROM conflicts WHERE "entityId" LIKE '${T}-%'`);
    await app.close();
  });

  // ─── Battery ─────────────────────────────────────────────────────────────

  describe('Battery', () => {
    it('should insert a battery', async () => {
      await batteryRepo.insert({
        id: `${T}-battery-1`,
        sku: 'SKU-001',
        batteryType: 'Lithium',
        batteryVersion: 'v1',
        lithiumVersion: 'L1',
        source: { sku: 'SKU-001' },
      });

      const found = await batteryRepo.findById(`${T}-battery-1`);
      expect(found).not.toBeNull();
      expect(found!.sku).toBe('SKU-001');
      expect(found!.batteryType).toBe('Lithium');
    });

    it('should insert multiple batteries with insertMany', async () => {
      await batteryRepo.insertMany([
        {
          id: `${T}-battery-2`,
          sku: 'SKU-002',
          batteryType: 'NiMH',
          batteryVersion: 'v2',
          lithiumVersion: null,
          source: null,
        },
        {
          id: `${T}-battery-3`,
          sku: 'SKU-003',
          batteryType: 'Solar',
          batteryVersion: 'v3',
          lithiumVersion: null,
          source: null,
        },
      ]);

      const b2 = await batteryRepo.findById(`${T}-battery-2`);
      const b3 = await batteryRepo.findById(`${T}-battery-3`);
      expect(b2?.sku).toBe('SKU-002');
      expect(b3?.sku).toBe('SKU-003');
    });

    it('should include inserted batteries in findAll', async () => {
      const all = await batteryRepo.findAll();
      const ids = all.map((b) => b.id);
      expect(ids).toContain(`${T}-battery-1`);
      expect(ids).toContain(`${T}-battery-2`);
      expect(ids).toContain(`${T}-battery-3`);
    });
  });

  // ─── Storage ─────────────────────────────────────────────────────────────

  describe('Storage', () => {
    it('should insert a storage', async () => {
      await storageRepo.insert({
        id: `${T}-storage-1`,
        storageType: 'SSD',
        storageVersion: 'v1',
        isStockNetanya: true,
        isStockAfula: false,
        source: null,
      });

      const found = await storageRepo.findById(`${T}-storage-1`);
      expect(found?.storageType).toBe('SSD');
      expect(found?.isStockNetanya).toBe(true);
      expect(found?.isStockAfula).toBe(false);
    });
  });

  // ─── Iron ─────────────────────────────────────────────────────────────────

  describe('Iron', () => {
    it('should insert an iron', async () => {
      await ironRepo.insert({
        id: `${T}-iron-1`,
        ironType: 'Cast',
        ironVersion: 'v1',
        isHeatConductor: true,
        source: null,
      });

      const found = await ironRepo.findById(`${T}-iron-1`);
      expect(found?.ironType).toBe('Cast');
      expect(found?.isHeatConductor).toBe(true);
    });
  });

  // ─── Cardboard ───────────────────────────────────────────────────────────

  describe('Cardboard', () => {
    it('should insert a cardboard', async () => {
      await cardboardRepo.insert({
        id: `${T}-cardboard-1`,
        cardboardType: 'Corrugated',
        cardboardVersion: 'v1',
        source: null,
      });

      const found = await cardboardRepo.findById(`${T}-cardboard-1`);
      expect(found?.cardboardType).toBe('Corrugated');
    });
  });

  // ─── Sensor ───────────────────────────────────────────────────────────────

  describe('Sensor', () => {
    it('should insert a sensor', async () => {
      await sensorRepo.insert({
        id: `${T}-sensor-1`,
        sensorType: 'Lidar',
        sensorVersion: 'v4',
        source: null,
      });

      const found = await sensorRepo.findById(`${T}-sensor-1`);
      expect(found?.sensorType).toBe('Lidar');
      expect(found?.sensorVersion).toBe('v4');
    });
  });

  // ─── Sale ─────────────────────────────────────────────────────────────────

  describe('Sale', () => {
    it('should insert a sale', async () => {
      await saleRepo.insert({
        id: `${T}-sale-1`,
        carrier: 'FedEx',
        onlineStoreName: 'Amazon',
        salesperson: 'Test User',
        isPurchased: true,
        isStockAshdod: false,
        isStockTelAviv: true,
        isStockRehovot: false,
        notes: 'test sale',
        dataSource: 'CRM',
        source: null,
      });

      const found = await saleRepo.findById(`${T}-sale-1`);
      expect(found?.carrier).toBe('FedEx');
      expect(found?.isPurchased).toBe(true);
      expect(found?.isStockTelAviv).toBe(true);
    });
  });

  // ─── Plastic (depends on Battery) ────────────────────────────────────────

  describe('Plastic', () => {
    it('should insert a plastic with batteryId FK', async () => {
      await plasticRepo.insert({
        id: `${T}-plastic-1`,
        plasticType: 'ABS',
        battery: { id: `${T}-battery-1` } as BatteryEntity,
        source: null,
      });

      const found = await plasticRepo.findById(`${T}-plastic-1`);
      expect(found?.plasticType).toBe('ABS');
      expect(found?.batteryId).toBe(`${T}-battery-1`);
    });
  });

  // ─── Wiring (depends on Storage) ─────────────────────────────────────────

  describe('Wiring', () => {
    it('should insert a wiring with storageId FK', async () => {
      await wiringRepo.insert({
        id: `${T}-wiring-1`,
        wiringType: 'Copper',
        district: 'North',
        municipality: 'Haifa',
        storage: { id: `${T}-storage-1` } as StorageEntity,
        source: null,
      });

      const found = await wiringRepo.findById(`${T}-wiring-1`);
      expect(found?.wiringType).toBe('Copper');
      expect(found?.storageId).toBe(`${T}-storage-1`);
    });
  });

  // ─── Communication (depends on Plastic + Iron) ───────────────────────────

  describe('Communication', () => {
    it('should insert a communication with plasticId and ironId FKs', async () => {
      await communicationRepo.insert({
        id: `${T}-communication-1`,
        communicationType: 'WiFi',
        plastic: { id: `${T}-plastic-1` } as PlasticEntity,
        iron: { id: `${T}-iron-1` } as IronEntity,
        source: null,
      });

      const found = await communicationRepo.findById(`${T}-communication-1`);
      expect(found?.communicationType).toBe('WiFi');
      expect(found?.plasticId).toBe(`${T}-plastic-1`);
      expect(found?.ironId).toBe(`${T}-iron-1`);
    });
  });

  // ─── Robot (depends on all above) ────────────────────────────────────────

  describe('Robot', () => {
    it('should insert a robot with all FKs', async () => {
      await robotRepo.insert({
        id: `${T}-robot-1`,
        cardboard: { id: `${T}-cardboard-1` } as CardboardEntity,
        sensor: { id: `${T}-sensor-1` } as SensorEntity,
        communication: { id: `${T}-communication-1` } as CommunicationEntity,
        sale: { id: `${T}-sale-1` } as SaleEntity,
        wiring: { id: `${T}-wiring-1` } as WiringEntity,
        source: null,
      });

      const found = await robotRepo.findById(`${T}-robot-1`);
      expect(found).not.toBeNull();
      expect(found?.cardboardId).toBe(`${T}-cardboard-1`);
      expect(found?.sensorId).toBe(`${T}-sensor-1`);
      expect(found?.communicationId).toBe(`${T}-communication-1`);
      expect(found?.saleId).toBe(`${T}-sale-1`);
      expect(found?.wiringId).toBe(`${T}-wiring-1`);
    });

    it('should load robot with all direct relations', async () => {
      const robot = await dataSource.getRepository(RobotEntity).findOne({
        where: { id: `${T}-robot-1` },
        relations: ['cardboard', 'sensor', 'communication', 'sale', 'wiring'],
      });

      expect(robot?.cardboard?.cardboardType).toBe('Corrugated');
      expect(robot?.sensor?.sensorType).toBe('Lidar');
      expect(robot?.communication?.communicationType).toBe('WiFi');
      expect(robot?.sale?.carrier).toBe('FedEx');
      expect(robot?.wiring?.wiringType).toBe('Copper');
    });

    it('should load robot with nested relations (communication → plastic → battery)', async () => {
      const robot = await dataSource.getRepository(RobotEntity).findOne({
        where: { id: `${T}-robot-1` },
        relations: ['communication', 'communication.plastic', 'communication.plastic.battery', 'communication.iron'],
      });

      expect(robot?.communication?.plastic?.plasticType).toBe('ABS');
      expect(robot?.communication?.plastic?.battery?.sku).toBe('SKU-001');
      expect(robot?.communication?.iron?.ironType).toBe('Cast');
    });

    it('should load wiring with all its robots (OneToMany)', async () => {
      const wiring = await dataSource.getRepository(WiringEntity).findOne({
        where: { id: `${T}-wiring-1` },
        relations: ['robots'],
      });

      expect(wiring?.robots.map((r) => r.id)).toContain(`${T}-robot-1`);
    });
  });

  // ─── Conflict (auto-increment id) ────────────────────────────────────────

  describe('Conflict', () => {
    it('should insert a conflict record and find it in findAll', async () => {
      await conflictRepo.insert({
        tableName: 'robots',
        columnName: 'sensorType',
        entityId: `${T}-robot-1`,
        newValue: 'Lidar-v2',
        newSource: 'ERP',
        oldValue: 'Lidar-v1',
        oldSource: 'CRM',
        conflictCreator: 'system',
        conflictResolver: null,
        isSolved: false,
        notes: null,
      });

      const all = await conflictRepo.findAll();
      const conflict = all.find((c) => c.entityId === `${T}-robot-1`);
      expect(conflict).not.toBeUndefined();
      expect(conflict?.isSolved).toBe(false);
      expect(conflict?.newValue).toBe('Lidar-v2');
      expect(conflict?.oldValue).toBe('Lidar-v1');
    });

    it('should find a conflict by auto-generated id', async () => {
      const all = await conflictRepo.findAll();
      const conflict = all.find((c) => c.entityId === `${T}-robot-1`);
      const byId = await conflictRepo.findById(conflict!.id);
      expect(byId?.entityId).toBe(`${T}-robot-1`);
    });
  });

  // ─── Soft Delete ─────────────────────────────────────────────────────────

  describe('Soft delete', () => {
    it('should soft-delete an entity and exclude it from findAll and findById', async () => {
      await batteryRepo.insert({
        id: `${T}-battery-soft`,
        sku: 'SKU-SOFT',
        batteryType: 'Test',
        batteryVersion: 'v0',
        lithiumVersion: null,
        source: null,
      });

      await batteryRepo.softDelete(`${T}-battery-soft`);

      const byId = await batteryRepo.findById(`${T}-battery-soft`);
      expect(byId).toBeNull();

      const all = await batteryRepo.findAll();
      expect(all.map((b) => b.id)).not.toContain(`${T}-battery-soft`);
    });
  });
});
