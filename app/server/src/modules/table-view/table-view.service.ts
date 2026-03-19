import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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

/** conflictMap[tableName][entityId][columnName] */
type ConflictMap = Record<string, Record<string, Record<string, { status: 'open' | 'resolved'; conflictId: number | null }>>>;

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

    const conflictMap = await this._buildConflictMap(tablesInvolved, rows);

    return {
      rows: rows.map((row) => this._buildResponseRow(columns, row, conflictMap)),
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
    return JOIN_ORDER.filter((table) => tablesInvolved.has(table) && table !== rootTable).map((table) => {
      const { parentTable, fkColumn } = PARENT_JOIN[table];
      return `LEFT JOIN "${table}" ON "${parentTable}"."${fkColumn}" = "${table}"."id" AND "${table}"."deletedAt" IS NULL`;
    });
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

  private async _buildConflictMap(tablesInvolved: Set<string>, rows: Record<string, unknown>[]): Promise<ConflictMap> {
    const conflictMap: ConflictMap = {};

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
      return conflictMap;
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    Object.entries(entityIdsByTable).forEach(([table, ids]) => {
      params.push(ids);
      conditions.push(`("tableName" = '${table}' AND "entityId" = ANY($${params.length}))`);
    });

    const conflictSql = `
      SELECT "tableName", "entityId", "columnName", "isSolved", "id"
      FROM conflicts
      WHERE "deletedAt" IS NULL AND (${conditions.join(' OR ')})
    `;

    const conflicts: ConflictRow[] = await this._dataSource.query(conflictSql, params);

    conflicts.forEach(({ tableName, entityId, columnName, isSolved, id }) => {
      if (!conflictMap[tableName]) {
        conflictMap[tableName] = {};
      }
      if (!conflictMap[tableName][entityId]) {
        conflictMap[tableName][entityId] = {};
      }

      const existing = conflictMap[tableName][entityId][columnName];
      // Open conflict takes priority over resolved.
      if (!existing || (isSolved === false && existing.status !== 'open')) {
        conflictMap[tableName][entityId][columnName] = {
          status: isSolved === false ? 'open' : 'resolved',
          conflictId: isSolved === false ? id : null,
        };
      }
    });

    return conflictMap;
  }

  private _buildResponseRow(columns: string[], row: Record<string, unknown>, conflictMap: ConflictMap): TableRow {
    const result: TableRow = {};

    columns.forEach((colKey) => {
      const [table, column] = colKey.split('.');
      const entityId = row[`${table}__id`] as string | null;
      const rawValue = row[`${table}__${column}`];
      const sourceMap = row[`${table}__source`] as Record<string, string | null> | null;
      const notesMap = row[`${table}__notes`] as Record<string, string | null> | null;

      const conflictEntry = entityId ? conflictMap[table]?.[entityId]?.[column] : undefined;

      const createdAt = row[`${table}__createdAt`];

      const cell: TableCell = {
        value: rawValue !== undefined && rawValue !== null ? String(rawValue) : null,
        status: conflictEntry?.status ?? 'raw',
        source: sourceMap?.[column] ?? null,
        notes: notesMap?.[column] ?? null,
        uploadedAt: createdAt instanceof Date ? createdAt.toISOString() : (createdAt as string | null) ?? null,
        conflictId: conflictEntry?.conflictId ?? null,
      };

      result[colKey] = cell;
    });

    return result;
  }
}
