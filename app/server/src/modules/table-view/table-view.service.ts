import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { FK_FIELD_TO_TABLE } from '../../shared/consts/entity-relation-map.const';
import { ALLOWED_COLUMNS, ALLOWED_TABLES } from './consts/allowed-entities.consts';
import { JOIN_ORDER, PARENT_JOIN } from './consts/join-chain.consts';
import { TableViewQueryDto } from './dto/table-view-query.dto';
import { TableCell } from './types/table-cell.type';
import { TableRow, TableViewResponse } from './types/table-view-response.type';

type ConflictRow = {
  tableName: string;
  entityId: string;
  columnName: string;
  isSolved: boolean | null;
  id: number;
};

type RelationalConflictRow = {
  anchorTable: string;
  anchorId: string;
  relatedTable: string;
  conflictType: string;
  oldRelatedId: string;
  newRelatedId: string;
  isSolved: boolean | null;
  id: number;
};

type ConflictEntry = { status: 'open' | 'resolved'; conflictId: number | null; anchorTable: string | null; anchorId: string | null };

/** conflictMap[tableName][entityId][columnName] */
type ConflictMap = Record<string, Record<string, Record<string, ConflictEntry>>>;

/**
 * nullConflictMap[rootTable][rootEntityId][colKey]
 * Used when a joined entity's ID is null — the cell is colored based on the root row's entity.
 */
type NullConflictMap = Record<string, Record<string, Record<string, ConflictEntry>>>;

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

    // Walk up ancestors to ensure intermediate join tables are included.
    let changed = true;
    while (changed) {
      changed = false;
      tables.forEach((table) => {
        if (table === rootTable) {
          return;
        }
        const parent = PARENT_JOIN[table];
        if (parent && !tables.has(parent.parentTable)) {
          tables.add(parent.parentTable);
          changed = true;
        }
      });
    }

    return tables;
  }

  private _buildJoinClauses(rootTable: string, tablesInvolved: Set<string>): string[] {
    const available = new Set<string>([rootTable]);
    const clauses: string[] = [];

    // Tables in JOIN_ORDER first, then any remaining (e.g. 'robots' which is never in JOIN_ORDER).
    const toJoin = [
      ...JOIN_ORDER.filter((t) => tablesInvolved.has(t) && t !== rootTable),
      ...[...tablesInvolved].filter((t) => t !== rootTable && !JOIN_ORDER.includes(t)),
    ];

    let remaining = toJoin;

    while (remaining.length > 0) {
      const sizeBefore = remaining.length;
      const nextRemaining: string[] = [];

      remaining.forEach((table) => {
        const joinDef = PARENT_JOIN[table];

        if (joinDef && available.has(joinDef.parentTable)) {
          // Downward join: parent is already in the FROM/JOIN set.
          clauses.push(
            `LEFT JOIN "${table}" ON "${joinDef.parentTable}"."${joinDef.fkColumn}" = "${table}"."id" AND "${table}"."deletedAt" IS NULL`,
          );
          available.add(table);
        } else {
          // Upward join: find a child already available whose PARENT_JOIN points to this table.
          const child = [...available].find((t) => PARENT_JOIN[t]?.parentTable === table);
          if (child) {
            const childFk = PARENT_JOIN[child].fkColumn;
            clauses.push(
              `LEFT JOIN "${table}" ON "${table}"."${childFk}" = "${child}"."id" AND "${table}"."deletedAt" IS NULL`,
            );
            available.add(table);
          } else {
            nextRemaining.push(table);
          }
        }
      });

      if (nextRemaining.length === sizeBefore) {
        break; // No progress — avoid infinite loop.
      }
      remaining = nextRemaining;
    }

    return clauses;
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

    // Always select source, notes, and createdAt for every involved table (cell metadata).
    tablesInvolved.forEach((table) => {
      parts.push(`"${table}"."source" AS "${table}__source"`);
      parts.push(`"${table}"."notes" AS "${table}__notes"`);
      parts.push(`"${table}"."createdAt" AS "${table}__createdAt"`);
    });

    return parts.join(', ');
  }

  private _buildWhereClauses(filters: Record<string, string>): { whereClauses: string[]; whereParams: unknown[] } {
    const whereClauses: string[] = [];
    const whereParams: unknown[] = [];

    Object.entries(filters).forEach(([colKey, value]) => {
      if (!value) {
        return;
      }
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
      if (ids.length > 0) {
        entityIdsByTable[table] = [...new Set(ids)];
      }
    });

    if (Object.keys(entityIdsByTable).length === 0) {
      return { conflictMap, nullConflictMap };
    }

    // --- Value conflicts ---
    const valueConditions: string[] = [];
    const valueParams: unknown[] = [];
    Object.entries(entityIdsByTable).forEach(([table, ids]) => {
      valueParams.push(ids);
      valueConditions.push(`("tableName" = '${table}' AND "entityId" = ANY($${valueParams.length}))`);
    });

    const valueConflictSql = `
      SELECT "tableName", "entityId", "columnName", "isSolved", "id"
      FROM value_conflicts
      WHERE "deletedAt" IS NULL AND (${valueConditions.join(' OR ')})
    `;

    // --- Relational conflicts by anchor (anchorTable/anchorId in our entity set) ---
    const anchorConditions: string[] = [];
    const anchorParams: unknown[] = [];
    Object.entries(entityIdsByTable).forEach(([table, ids]) => {
      anchorParams.push(ids);
      anchorConditions.push(`("anchorTable" = '${table}' AND "anchorId" = ANY($${anchorParams.length}))`);
    });

    const relByAnchorSql = `
      SELECT "anchorTable", "anchorId", "relatedTable", "conflictType", "oldRelatedId", "newRelatedId", "isSolved", "id"
      FROM relational_conflicts
      WHERE "deletedAt" IS NULL AND (${anchorConditions.join(' OR ')})
    `;

    // --- Relational conflicts by related (relatedTable + oldRelatedId/newRelatedId in our entity set) ---
    const relatedConditions: string[] = [];
    const relatedParams: unknown[] = [];
    Object.entries(entityIdsByTable).forEach(([table, ids]) => {
      relatedParams.push(ids);
      const idx = relatedParams.length;
      relatedConditions.push(`("relatedTable" = '${table}' AND ("oldRelatedId" = ANY($${idx}) OR "newRelatedId" = ANY($${idx})))`);
    });

    const relByRelatedSql = `
      SELECT "anchorTable", "anchorId", "relatedTable", "conflictType", "oldRelatedId", "newRelatedId", "isSolved", "id"
      FROM relational_conflicts
      WHERE "deletedAt" IS NULL AND (${relatedConditions.join(' OR ')})
    `;

    const [valueConflicts, relByAnchor, relByRelated] = await Promise.all([
      this._dataSource.query(valueConflictSql, valueParams) as Promise<ConflictRow[]>,
      this._dataSource.query(relByAnchorSql, anchorParams) as Promise<RelationalConflictRow[]>,
      this._dataSource.query(relByRelatedSql, relatedParams) as Promise<RelationalConflictRow[]>,
    ]);

    const markCell = (map: ConflictMap, table: string, entityId: string, column: string, entry: ConflictEntry): void => {
      if (!map[table]) { map[table] = {}; }
      if (!map[table][entityId]) { map[table][entityId] = {}; }
      const existing = map[table][entityId][column];
      if (!existing || (entry.status === 'open' && existing.status !== 'open')) {
        map[table][entityId][column] = entry;
      }
    };

    const markNull = (relatedTable: string, relatedId: string, colKey: string, entry: ConflictEntry): void => {
      if (!nullConflictMap[relatedTable]) { nullConflictMap[relatedTable] = {}; }
      if (!nullConflictMap[relatedTable][relatedId]) { nullConflictMap[relatedTable][relatedId] = {}; }
      const existing = nullConflictMap[relatedTable][relatedId][colKey];
      if (!existing || (entry.status === 'open' && existing.status !== 'open')) {
        nullConflictMap[relatedTable][relatedId][colKey] = entry;
      }
    };

    const toValueEntry = (isSolved: boolean | null, id: number): ConflictEntry => ({
      status: isSolved === false ? 'open' : 'resolved',
      conflictId: isSolved === false ? id : null,
      anchorTable: null,
      anchorId: null,
    });

    const toRelationalEntry = (isSolved: boolean | null, id: number, anchorTable: string, anchorId: string): ConflictEntry => ({
      status: isSolved === false ? 'open' : 'resolved',
      conflictId: isSolved === false ? id : null,
      anchorTable,
      anchorId,
    });

    // Process value conflicts.
    valueConflicts.forEach(({ tableName, entityId, columnName, isSolved, id }) => {
      markCell(conflictMap, tableName, entityId, columnName, toValueEntry(isSolved, id));
    });

    // Process relational conflicts from both queries (union via idempotent markCell).
    [...relByAnchor, ...relByRelated].forEach((rc) => {
      const entry = toRelationalEntry(rc.isSolved, rc.id, rc.anchorTable, rc.anchorId);

      if (rc.conflictType === 'TWO_CHILDS') {
        // 1. Anchor entity's FK column (e.g. robots/robot123/communicationId).
        const fkColumn = `${rc.relatedTable.slice(0, -1)}Id`;
        markCell(conflictMap, rc.anchorTable, rc.anchorId, fkColumn, entry);

        // 2. Old related entity's id cell (e.g. communications/comm555/id).
        markCell(conflictMap, rc.relatedTable, rc.oldRelatedId, 'id', entry);

        // 3. New related entity's joined-anchor cell will be null → mark in nullConflictMap
        //    so that when viewing the relatedTable with anchorTable.id joined, the null cell turns red.
        markNull(rc.relatedTable, rc.newRelatedId, `${rc.anchorTable}.id`, entry);
      }

      if (rc.conflictType === 'TWO_FATHERS') {
        // 1. Old related entity (first owner) id cell (e.g. robots/robot123/id).
        markCell(conflictMap, rc.relatedTable, rc.oldRelatedId, 'id', entry);

        // 2. New related entity's FK field that was nulled out (e.g. robots/robot777/communicationId).
        const fkField = Object.keys(FK_FIELD_TO_TABLE).find((k) => FK_FIELD_TO_TABLE[k] === rc.anchorTable);
        if (fkField) {
          markCell(conflictMap, rc.relatedTable, rc.newRelatedId, fkField, entry);
        }
      }
    });

    return { conflictMap, nullConflictMap };
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
          uploadedAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt as string | null) ?? null,
          conflictId: null,
          anchorTable: null,
          anchorId: null,
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

      const cell: TableCell = {
        value: rawValue !== undefined && rawValue !== null ? String(rawValue) : null,
        status: conflictEntry?.status ?? 'raw',
        source: sourceMap?.[column] ?? null,
        notes: notesMap?.[column] ?? null,
        uploadedAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt as string | null) ?? null,
        conflictId: conflictEntry?.conflictId ?? null,
        anchorTable: conflictEntry?.anchorTable ?? null,
        anchorId: conflictEntry?.anchorId ?? null,
      };

      result[colKey] = cell;
    });

    return result;
  }
}
