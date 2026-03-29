import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { FK_FIELD_TO_TABLE } from '../../shared/consts/fk-field-to-table.const';
import { ALLOWED_COLUMNS, ALLOWED_TABLES } from './consts/allowed-entities.consts';
import { JOIN_ORDER, PARENT_JOIN } from './consts/join-chain.consts';
import { TableViewQueryDto } from './dto/table-view-query.dto';
import { ConflictEntry, ConflictMap, NullConflictMap } from './types/conflict-map.type';
import { ConflictRow } from './types/conflict-row.type';
import { CrossEntityConflictRow } from './types/cross-entity-conflict-row.type';
import { RelationalConflictRow } from './types/relational-conflict-row.type';
import { TableCell } from './types/table-cell.type';
import { TableRow, TableViewResponse } from './types/table-view-response.type';

@Injectable()
export class TableViewService {
  public constructor(@InjectDataSource() private readonly _dataSource: DataSource) {}

  public async query(dto: TableViewQueryDto): Promise<TableViewResponse> {
    this._validateInput(dto);

    const { tableName, columns, filters, page, pageSize } = dto;
    const tablesInvolved = this._computeTablesInvolved(tableName, columns, Object.keys(filters));
    const joinClauses = this._buildJoinClauses(tableName, tablesInvolved);
    const { whereClauses, whereParams } = this._buildWhereClauses(filters);

    const fromFragment = `FROM "${tableName}" ${joinClauses.join(' ')}`;
    const whereFragment = `WHERE "${tableName}"."deletedAt" IS NULL${whereClauses.length > 0 ? ` AND (${whereClauses.join(' AND ')})` : ''}`;

    const dataParams = [...whereParams, pageSize, (page - 1) * pageSize];
    const paramOffset = whereParams.length;

    const dataSql = `
      SELECT ${this._buildSelectClauses(tableName, columns, tablesInvolved)}
      ${fromFragment}
      ${whereFragment}
      ORDER BY "${tableName}"."id"
      LIMIT $${paramOffset + 1} OFFSET $${paramOffset + 2}
    `;

    const countSql = `SELECT COUNT(*) AS total ${fromFragment} ${whereFragment}`;

    const [rows, countResult] = await Promise.all([
      this._dataSource.query(dataSql, dataParams) as Promise<Record<string, unknown>[]>,
      this._dataSource.query(countSql, whereParams) as Promise<[{ total: string }]>,
    ]);

    const { conflictMap, nullConflictMap } = await this._buildConflictMap(tablesInvolved, rows);

    return {
      rows: rows.map((row) => this._buildResponseRow(columns, row, conflictMap, nullConflictMap, tableName)),
      total: parseInt(countResult[0].total, 10),
    };
  }

  private _validateInput({ tableName, columns, filters }: TableViewQueryDto): void {
    if (!ALLOWED_TABLES.has(tableName)) {
      throw new BadRequestException(`Invalid table: ${tableName}`);
    }

    const allKeys = [...columns, ...Object.keys(filters)];
    allKeys.forEach((col) => {
      const [table, column] = col.split('.');
      if (!ALLOWED_COLUMNS[table]?.has(column)) {
        throw new BadRequestException(`Invalid column: ${col}`);
      }
    });
  }

  private _computeTablesInvolved(rootTable: string, columns: string[], filterKeys: string[]): Set<string> {
    const tables = new Set<string>([rootTable]);
    [...columns, ...filterKeys].forEach((col) => tables.add(col.split('.')[0]));
    return this._expandAncestors(tables, rootTable);
  }

  /** Recursively adds ancestor tables until the set is stable (no new parents found). */
  private _expandAncestors(tables: Set<string>, rootTable: string): Set<string> {
    const sizeBefore = tables.size;
    tables.forEach((table) => {
      if (table === rootTable) { return; }
      const parent = PARENT_JOIN[table];
      if (parent && !tables.has(parent.parentTable)) { tables.add(parent.parentTable); }
    });
    return tables.size === sizeBefore ? tables : this._expandAncestors(tables, rootTable);
  }

  private _buildJoinClauses(rootTable: string, tablesInvolved: Set<string>): string[] {
    const available = new Set<string>([rootTable]);
    const clauses: string[] = [];
    const toJoin = [
      ...JOIN_ORDER.filter((t) => tablesInvolved.has(t) && t !== rootTable),
      ...[...tablesInvolved].filter((t) => t !== rootTable && !JOIN_ORDER.includes(t)),
    ];
    return this._resolveJoinClauses(toJoin, available, clauses);
  }

  /** Recursively resolves join clauses, processing tables whose parent is already available each pass. */
  private _resolveJoinClauses(remaining: string[], available: Set<string>, clauses: string[]): string[] {
    if (remaining.length === 0) { return clauses; }
    const nextRemaining = remaining.filter((table) => !this._tryJoinTable(table, available, clauses));
    if (nextRemaining.length === remaining.length) { return clauses; } // No progress — stop.
    return this._resolveJoinClauses(nextRemaining, available, clauses);
  }

  /** Tries to join a table either downward (parent → child) or upward (child → parent). Returns true if joined. */
  private _tryJoinTable(table: string, available: Set<string>, clauses: string[]): boolean {
    const joinDef = PARENT_JOIN[table];
    if (joinDef && available.has(joinDef.parentTable)) {
      clauses.push(`LEFT JOIN "${table}" ON "${joinDef.parentTable}"."${joinDef.fkColumn}" = "${table}"."id" AND "${table}"."deletedAt" IS NULL`);
      available.add(table);
      return true;
    }
    const child = [...available].find((t) => PARENT_JOIN[t]?.parentTable === table);
    if (child) {
      clauses.push(`LEFT JOIN "${table}" ON "${table}"."${PARENT_JOIN[child].fkColumn}" = "${child}"."id" AND "${table}"."deletedAt" IS NULL`);
      available.add(table);
      return true;
    }
    return false;
  }

  private _buildSelectClauses(rootTable: string, columns: string[], tablesInvolved: Set<string>): string {
    const parts: string[] = [];

    // Always select id for every involved table (needed for conflict lookup and row identity).
    tablesInvolved.forEach((table) => parts.push(`"${table}"."id" AS "${table}__id"`));

    // Select requested data columns (skip id — already covered above).
    columns.forEach((col) => {
      const [table, column] = col.split('.');
      if (column !== 'id') {
        parts.push(`"${table}"."${column}" AS "${table}__${column}"`);
      }
    });

    // Always select source, notes, sourceTime, and createdAt for every involved table (cell metadata).
    tablesInvolved.forEach((table) => {
      parts.push(`"${table}"."source" AS "${table}__source"`);
      parts.push(`"${table}"."notes" AS "${table}__notes"`);
      parts.push(`"${table}"."sourceTime" AS "${table}__sourceTime"`);
      parts.push(`"${table}"."createdAt" AS "${table}__createdAt"`);
    });

    return parts.join(', ');
  }

  private _buildWhereClauses(filters: Record<string, string>): { whereClauses: string[]; whereParams: unknown[] } {
    const whereClauses: string[] = [];
    const whereParams: unknown[] = [];

    Object.entries(filters).forEach(([colKey, value]) => {
      if (!value) { return; }
      const [table, column] = colKey.split('.');
      whereClauses.push(`"${table}"."${column}"::text ILIKE $${whereParams.length + 1}`);
      whereParams.push(`%${value}%`);
    });

    return { whereClauses, whereParams };
  }

  private async _buildConflictMap(
    tablesInvolved: Set<string>,
    rows: Record<string, unknown>[],
  ): Promise<{ conflictMap: ConflictMap; nullConflictMap: NullConflictMap }> {
    const conflictMap: ConflictMap = {};
    const nullConflictMap: NullConflictMap = {};

    const entityIdsByTable: Record<string, string[]> = {};
    tablesInvolved.forEach((table) => {
      const ids = rows
        .map((row) => row[`${table}__id`])
        .filter((id): id is string => typeof id === 'string');
      if (ids.length > 0) { entityIdsByTable[table] = [...new Set(ids)]; }
    });

    if (Object.keys(entityIdsByTable).length === 0) { return { conflictMap, nullConflictMap }; }

    const [valueConflicts, relByAnchor, relByRelated, crossEntityConflicts] = await this._fetchConflicts(entityIdsByTable);

    valueConflicts.forEach(({ tableName, entityId, columnName, isSolved, id }) => {
      this._markCell(conflictMap, tableName, entityId, columnName, this._toValueEntry(isSolved, id));
    });

    [...relByAnchor, ...relByRelated].forEach((rc) => {
      this._applyRelationalConflict(rc, conflictMap, nullConflictMap);
    });

    crossEntityConflicts.forEach(({ id, robotId, wiringId, fieldName, isSolved }) => {
      const entry = this._toValueEntry(isSolved, id);
      this._markCell(conflictMap, 'robots', robotId, fieldName, entry);
      this._markCell(conflictMap, 'wirings', wiringId, fieldName, entry);
    });

    return { conflictMap, nullConflictMap };
  }

  private async _fetchConflicts(
    entityIdsByTable: Record<string, string[]>,
  ): Promise<[ConflictRow[], RelationalConflictRow[], RelationalConflictRow[], CrossEntityConflictRow[]]> {
    const valueParams: unknown[] = [];
    const valueConditions = Object.entries(entityIdsByTable).map(([table, ids]) => {
      valueParams.push(ids);
      return `("tableName" = '${table}' AND "entityId" = ANY($${valueParams.length}))`;
    });

    const anchorParams: unknown[] = [];
    const anchorConditions = Object.entries(entityIdsByTable).map(([table, ids]) => {
      anchorParams.push(ids);
      return `("anchorTable" = '${table}' AND "anchorId" = ANY($${anchorParams.length}))`;
    });

    const relatedParams: unknown[] = [];
    const relatedConditions = Object.entries(entityIdsByTable).map(([table, ids]) => {
      relatedParams.push(ids);
      const idx = relatedParams.length;
      return `("relatedTable" = '${table}' AND ("oldRelatedId" = ANY($${idx}) OR "newRelatedId" = ANY($${idx})))`;
    });

    const robotIds = entityIdsByTable['robots'] ?? [];
    const wiringIds = entityIdsByTable['wirings'] ?? [];
    const hasCrossEntityTables = robotIds.length > 0 || wiringIds.length > 0;
    const crossEntityQuery = hasCrossEntityTables
      ? (this._dataSource.query(
          `SELECT "id", "robotId", "wiringId", "fieldName", "isSolved" FROM cross_entity_conflicts WHERE "deletedAt" IS NULL AND ("robotId" = ANY($1) OR "wiringId" = ANY($2))`,
          [robotIds.length > 0 ? robotIds : [''], wiringIds.length > 0 ? wiringIds : ['']],
        ) as Promise<CrossEntityConflictRow[]>)
      : Promise.resolve<CrossEntityConflictRow[]>([]);

    return Promise.all([
      this._dataSource.query(
        `SELECT "tableName", "entityId", "columnName", "isSolved", "id" FROM value_conflicts WHERE "deletedAt" IS NULL AND (${valueConditions.join(' OR ')})`,
        valueParams,
      ) as Promise<ConflictRow[]>,
      this._dataSource.query(
        `SELECT "anchorTable", "anchorId", "relatedTable", "conflictType", "oldRelatedId", "newRelatedId", "isSolved", "id" FROM relational_conflicts WHERE "deletedAt" IS NULL AND (${anchorConditions.join(' OR ')})`,
        anchorParams,
      ) as Promise<RelationalConflictRow[]>,
      this._dataSource.query(
        `SELECT "anchorTable", "anchorId", "relatedTable", "conflictType", "oldRelatedId", "newRelatedId", "isSolved", "id" FROM relational_conflicts WHERE "deletedAt" IS NULL AND (${relatedConditions.join(' OR ')})`,
        relatedParams,
      ) as Promise<RelationalConflictRow[]>,
      crossEntityQuery,
    ]);
  }

  private _applyRelationalConflict(rc: RelationalConflictRow, conflictMap: ConflictMap, nullConflictMap: NullConflictMap): void {
    const entry = this._toRelationalEntry(rc.isSolved, rc.id, rc.anchorTable, rc.anchorId, rc.relatedTable);

    if (rc.conflictType === 'TWO_CHILDS') {
      // Anchor entity's FK column (e.g. communications/comm-test-001/ironId).
      this._markCell(conflictMap, rc.anchorTable, rc.anchorId, `${rc.relatedTable.slice(0, -1)}Id`, entry);
      // Both competing related entities' id cells.
      this._markCell(conflictMap, rc.relatedTable, rc.oldRelatedId, 'id', entry);
      this._markCell(conflictMap, rc.relatedTable, rc.newRelatedId, 'id', entry);
      // Both null joined-anchor cells — ensures the disconnected entity still shows a conflict indicator.
      this._markNull(nullConflictMap, rc.relatedTable, rc.oldRelatedId, `${rc.anchorTable}.id`, entry);
      this._markNull(nullConflictMap, rc.relatedTable, rc.newRelatedId, `${rc.anchorTable}.id`, entry);
    }

    if (rc.conflictType === 'TWO_FATHERS') {
      // Anchor entity id cell (e.g. communications/comm-test-001/id).
      this._markCell(conflictMap, rc.anchorTable, rc.anchorId, 'id', entry);
      // Old related entity (first owner) id cell.
      this._markCell(conflictMap, rc.relatedTable, rc.oldRelatedId, 'id', entry);
      // New related entity's FK field that was nulled out.
      const fkField = Object.keys(FK_FIELD_TO_TABLE).find((k) => FK_FIELD_TO_TABLE[k] === rc.anchorTable);
      if (fkField) { this._markCell(conflictMap, rc.relatedTable, rc.newRelatedId, fkField, entry); }
    }
  }

  private _markCell(map: ConflictMap, table: string, entityId: string, column: string, entry: ConflictEntry): void {
    if (!map[table]) { map[table] = {}; }
    if (!map[table][entityId]) { map[table][entityId] = {}; }
    const existing = map[table][entityId][column];
    // Open conflicts take priority over resolved — never downgrade an open conflict.
    if (!existing || (entry.status === 'open' && existing.status !== 'open')) {
      map[table][entityId][column] = entry;
    }
  }

  private _markNull(nullConflictMap: NullConflictMap, relatedTable: string, relatedId: string, colKey: string, entry: ConflictEntry): void {
    if (!nullConflictMap[relatedTable]) { nullConflictMap[relatedTable] = {}; }
    if (!nullConflictMap[relatedTable][relatedId]) { nullConflictMap[relatedTable][relatedId] = {}; }
    const existing = nullConflictMap[relatedTable][relatedId][colKey];
    if (!existing || (entry.status === 'open' && existing.status !== 'open')) {
      nullConflictMap[relatedTable][relatedId][colKey] = entry;
    }
  }

  private _toValueEntry(isSolved: boolean | null, id: number): ConflictEntry {
    return {
      status: isSolved === false ? 'open' : 'resolved',
      conflictId: isSolved === false ? id : null,
      anchorTable: null,
      anchorId: null,
      relatedTable: null,
    };
  }

  private _toRelationalEntry(isSolved: boolean | null, id: number, anchorTable: string, anchorId: string, relatedTable: string): ConflictEntry {
    return {
      status: isSolved === false ? 'open' : 'resolved',
      conflictId: isSolved === false ? id : null,
      anchorTable,
      anchorId,
      relatedTable,
    };
  }

  private _buildResponseRow(
    columns: string[],
    row: Record<string, unknown>,
    conflictMap: ConflictMap,
    nullConflictMap: NullConflictMap,
    rootTableName: string,
  ): TableRow {
    const result: TableRow = {};
    const rootEntityId = row[`${rootTableName}__id`] as string | null;

    // Always include {table}.id for every involved table so the conflict history popup
    // can resolve the entity ID regardless of which columns the user has selected.
    const involvedTables = new Set(columns.map((col) => col.split('.')[0]));
    involvedTables.forEach((table) => {
      const idKey = `${table}.id`;
      if (!columns.includes(idKey)) {
        const entityId = row[`${table}__id`] as string | null;
        const createdAt = row[`${table}__createdAt`];
        result[idKey] = {
          value: entityId,
          status: 'raw',
          source: null,
          notes: null,
          sourceTime: null,
          uploadedAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt as string | null) ?? null,
          conflictId: null,
          anchorTable: null,
          anchorId: null,
          relatedTable: null,
        };
      }
    });

    columns.forEach((colKey) => {
      const [table, column] = colKey.split('.');
      const entityId = row[`${table}__id`] as string | null;
      const rawValue = row[`${table}__${column}`];
      const sourceMap = row[`${table}__source`] as Record<string, string | null> | null;
      const notesMap = row[`${table}__notes`] as Record<string, string | null> | null;

      // Primary lookup: by (table, entityId, column).
      // Fallback for null joined entity: by (rootTable, rootEntityId, colKey) in nullConflictMap.
      const conflictEntry = entityId
        ? conflictMap[table]?.[entityId]?.[column]
        : (rootEntityId ? nullConflictMap[rootTableName]?.[rootEntityId]?.[colKey] : undefined);

      const createdAt = row[`${table}__createdAt`];

      const sourceTimeMap = row[`${table}__sourceTime`] as Record<string, string | null> | null;

      const cell: TableCell = {
        value: rawValue !== undefined && rawValue !== null ? String(rawValue) : null,
        status: conflictEntry?.status ?? 'raw',
        source: sourceMap?.[column] ?? null,
        notes: notesMap?.[column] ?? null,
        sourceTime: sourceTimeMap?.[column] ?? null,
        uploadedAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt as string | null) ?? null,
        conflictId: conflictEntry?.conflictId ?? null,
        anchorTable: conflictEntry?.anchorTable ?? null,
        anchorId: conflictEntry?.anchorId ?? null,
        relatedTable: conflictEntry?.relatedTable ?? null,
      };

      result[colKey] = cell;
    });

    return result;
  }
}
