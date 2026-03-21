import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictListResponse } from '../types/conflict-list-response.type';

@Injectable()
export class ValueConflictListService {
  public constructor(@InjectDataSource() private readonly _dataSource: DataSource) {}

  public async countOpen(): Promise<number> {
    const rows = await this._dataSource.query<[{ count: string }]>(`
      SELECT COUNT(*) AS count FROM (
        SELECT "tableName", "entityId" FROM value_conflicts WHERE "isSolved" = false AND "deletedAt" IS NULL
        UNION
        SELECT "anchorTable" AS "tableName", "anchorId" AS "entityId" FROM relational_conflicts WHERE "isSolved" = false AND "deletedAt" IS NULL
      ) combined
    `);
    return parseInt(rows[0].count, 10);
  }

  public async getOpenGroups(
    page: number,
    limit: number,
    tableName?: string,
    entityId?: string,
    conflictIds?: number[],
  ): Promise<ConflictListResponse> {
    const params: unknown[] = [];

    const valueFilter = this._buildValueFilter(tableName, entityId, conflictIds, params);
    const relationalFilter = this._buildRelationalFilter(tableName, entityId, params);

    const sql = `
      SELECT DISTINCT "tableName", "entityId"
      FROM (
        SELECT "tableName", "entityId"
        FROM value_conflicts
        WHERE "isSolved" = false AND "deletedAt" IS NULL ${valueFilter}
        UNION
        SELECT "anchorTable" AS "tableName", "anchorId" AS "entityId"
        FROM relational_conflicts
        WHERE "isSolved" = false AND "deletedAt" IS NULL ${relationalFilter}
      ) combined
      ORDER BY "tableName", "entityId"
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, (page - 1) * limit);

    return this._dataSource.query<ConflictListResponse>(sql, params);
  }

  private _buildValueFilter(
    tableName: string | undefined,
    entityId: string | undefined,
    conflictIds: number[] | undefined,
    params: unknown[],
  ): string {
    const clauses: string[] = [];
    if (tableName) {
      params.push(tableName);
      clauses.push(`AND "tableName" = $${params.length}`);
    }
    if (entityId) {
      params.push(`%${entityId}%`);
      clauses.push(`AND "entityId" ILIKE $${params.length}`);
    }
    if (conflictIds?.length) {
      params.push(conflictIds);
      clauses.push(`AND "id" = ANY($${params.length})`);
    }
    return clauses.join(' ');
  }

  private _buildRelationalFilter(
    tableName: string | undefined,
    entityId: string | undefined,
    params: unknown[],
  ): string {
    const clauses: string[] = [];
    if (tableName) {
      params.push(tableName);
      clauses.push(`AND "anchorTable" = $${params.length}`);
    }
    if (entityId) {
      params.push(`%${entityId}%`);
      clauses.push(`AND "anchorId" ILIKE $${params.length}`);
    }
    return clauses.join(' ');
  }
}
