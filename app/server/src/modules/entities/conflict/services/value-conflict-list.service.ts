import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictListResponse } from '../types/conflict-list-response.type';

@Injectable()
export class ValueConflictListService {
  public constructor(@InjectDataSource() private readonly _dataSource: DataSource) {}

  public async countOpen(): Promise<number> {
    const rows = await this._dataSource.query<[{ count: string }]>(`
      SELECT COUNT(*) AS count FROM value_conflicts WHERE "isSolved" = false AND "deletedAt" IS NULL
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
    const filter = this._buildFilter(tableName, entityId, conflictIds, params);

    const sql = `
      SELECT DISTINCT "tableName", "entityId"
      FROM value_conflicts
      WHERE "isSolved" = false AND "deletedAt" IS NULL ${filter}
      ORDER BY "tableName", "entityId"
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, (page - 1) * limit);
    return this._dataSource.query<ConflictListResponse>(sql, params);
  }

  private _buildFilter(
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
}
