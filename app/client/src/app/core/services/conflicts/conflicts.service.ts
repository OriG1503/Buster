import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConflictCountResponse } from '../../../shared/types/conflict-count-response.type';
import { ConflictGroup } from '../../../shared/types/conflict-group.type';
import { ConflictEntityDetail } from '../../../shared/types/conflict-entity-detail.type';

type ResolveValueConflictParams = {
  tableName: string;
  entityId: string;
  columnName: string;
  winnerValue: string;
  conflictResolver: string;
  resolutionNotes: string;
};

type ResolveRelationalConflictParams = {
  conflictIds: number[];
  winnerRelatedId: string;
  winnerChildId?: string | null;
  winnerChildFkField?: string | null;
  conflictResolver: string;
  resolutionNotes?: string | null;
};

@Injectable({ providedIn: 'root' })
export class ConflictsService {
  private readonly _http = inject(HttpClient);

  public getCount(): Observable<ConflictCountResponse> {
    return this._http.get<ConflictCountResponse>('/api/conflicts/count');
  }

  public getList(page: number, limit: number, tableName?: string, entityId?: string, conflictIds?: number[]): Observable<ConflictGroup[]> {
    const params: Record<string, string | number> = { page, limit };
    if (tableName) { params['tableName'] = tableName; }
    if (entityId) { params['entityId'] = entityId; }
    if (conflictIds?.length) { params['conflictIds'] = conflictIds.join(','); }
    return this._http.get<ConflictGroup[]>('/api/conflicts', { params });
  }

  public getEntityDetail(tableName: string, entityId: string): Observable<ConflictEntityDetail> {
    return this._http.get<ConflictEntityDetail>('/api/conflicts/entity', {
      params: { tableName, entityId },
    });
  }

  public resolveConflict(params: ResolveValueConflictParams): Observable<unknown> {
    return this._http.patch('/api/conflicts/value/resolve', params);
  }

  public resolveRelationalConflict(params: ResolveRelationalConflictParams): Observable<unknown> {
    return this._http.patch('/api/conflicts/relational/resolve', params);
  }

  public checkOpenIds(ids: string[]): Observable<string[]> {
    return this._http.post<string[]>('/api/conflicts/open-ids', { ids });
  }
}
