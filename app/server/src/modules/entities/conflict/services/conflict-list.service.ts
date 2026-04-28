import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictListResponse } from '../types/conflict-list-response.type';

@Injectable()
export class ConflictListService {
  public constructor(@InjectDataSource() private readonly _dataSource: DataSource) {}

  public async countOpen(): Promise<number> {
    const rows = await this._dataSource.query<[{ count: string }]>(`
      SELECT COUNT(*) AS count FROM (
        SELECT "tableName", "entityId" FROM value_conflicts WHERE "isSolved" = false AND "deletedAt" IS NULL
        UNION
        SELECT "anchorTable" AS "tableName", "anchorId" AS "entityId" FROM relational_conflicts WHERE "isSolved" = false AND "deletedAt" IS NULL
        UNION
        SELECT 'robots' AS "tableName", "robotId" AS "entityId" FROM cross_entity_conflicts WHERE "isSolved" = false AND "deletedAt" IS NULL
        UNION
        SELECT 'wirings' AS "tableName", "wiringId" AS "entityId" FROM cross_entity_conflicts WHERE "isSolved" = false AND "deletedAt" IS NULL
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
    startDate?: string,
    endDate?: string,
  ): Promise<ConflictListResponse> {
    const params: unknown[] = [];

    const valueFilter = this._buildValueFilter(tableName, entityId, conflictIds, startDate, endDate, params);
    const relationalFilter = this._buildRelationalFilter(tableName, entityId, startDate, endDate, params);

    const crossEntityRobotFilter = this._buildCrossEntityFilter(tableName, entityId, 'robot', startDate, endDate, params);
    const crossEntityWiringFilter = this._buildCrossEntityFilter(tableName, entityId, 'wiring', startDate, endDate, params);

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
        UNION
        SELECT 'robots' AS "tableName", "robotId" AS "entityId"
        FROM cross_entity_conflicts
        WHERE "isSolved" = false AND "deletedAt" IS NULL ${crossEntityRobotFilter}
        UNION
        SELECT 'wirings' AS "tableName", "wiringId" AS "entityId"
        FROM cross_entity_conflicts
        WHERE "isSolved" = false AND "deletedAt" IS NULL ${crossEntityWiringFilter}
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
    startDate: string | undefined,
    endDate: string | undefined,
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
    if (startDate) {
      params.push(startDate);
      clauses.push(`AND "createdAt"::date >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      clauses.push(`AND "createdAt"::date <= $${params.length}::date`);
    }
    return clauses.join(' ');
  }

  public async findOpenByEntityIds(ids: string[]): Promise<string[]> {
    if (!ids.length) { return []; }
    const result = await this._dataSource.query<Array<{ entityId: string }>>(
      `
      SELECT DISTINCT "entityId" FROM (
        SELECT "entityId" FROM value_conflicts
        WHERE "entityId" = ANY($1) AND "isSolved" = false AND "deletedAt" IS NULL
        UNION
        SELECT "anchorId" AS "entityId" FROM relational_conflicts
        WHERE "anchorId" = ANY($1) AND "isSolved" = false AND "deletedAt" IS NULL
        UNION
        SELECT "robotId" AS "entityId" FROM cross_entity_conflicts
        WHERE "robotId" = ANY($1) AND "isSolved" = false AND "deletedAt" IS NULL
        UNION
        SELECT "wiringId" AS "entityId" FROM cross_entity_conflicts
        WHERE "wiringId" = ANY($1) AND "isSolved" = false AND "deletedAt" IS NULL
      ) combined
      `,
      [ids],
    );
    return result.map((row) => row.entityId);
  }

  private _buildRelationalFilter(
    tableName: string | undefined,
    entityId: string | undefined,
    startDate: string | undefined,
    endDate: string | undefined,
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
    if (startDate) {
      params.push(startDate);
      clauses.push(`AND "createdAt"::date >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      clauses.push(`AND "createdAt"::date <= $${params.length}::date`);
    }
    return clauses.join(' ');
  }

  private _buildCrossEntityFilter(
    tableName: string | undefined,
    entityId: string | undefined,
    side: 'robot' | 'wiring',
    startDate: string | undefined,
    endDate: string | undefined,
    params: unknown[],
  ): string {
    const idColumn = side === 'robot' ? 'robotId' : 'wiringId';
    const expectedTable = side === 'robot' ? 'robots' : 'wirings';
    const clauses: string[] = [];
    if (tableName && tableName !== expectedTable) {
      return 'AND 1=0'; // filter out this branch if tableName doesn't match this side
    }
    if (entityId) {
      params.push(`%${entityId}%`);
      clauses.push(`AND "${idColumn}" ILIKE $${params.length}`);
    }
    if (startDate) {
      params.push(startDate);
      clauses.push(`AND "createdAt"::date >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      clauses.push(`AND "createdAt"::date <= $${params.length}::date`);
    }
    return clauses.join(' ');
  }
}
