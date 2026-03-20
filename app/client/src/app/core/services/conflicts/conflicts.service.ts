import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConflictCountResponse } from '../../../shared/types/conflict-count-response.type';
import { ConflictGroup } from '../../../shared/types/conflict-group.type';
import { ConflictEntityDetail } from '../../../shared/types/conflict-entity-detail.type';

type ResolveConflictParams = {
  tableName: string;
  entityId: string;
  columnName: string;
  winnerValue: string;
  conflictResolver: string;
  resolutionNotes: string;
};

@Injectable({ providedIn: 'root' })
export class ConflictsService {
  private readonly _http = inject(HttpClient);

  public getCount(): Observable<ConflictCountResponse> {
    return this._http.get<ConflictCountResponse>('/api/conflicts/count');
  }

  public getList(page: number, limit: number, tableName?: string, entityId?: string, sourceFile?: string): Observable<ConflictGroup[]> {
    const params: Record<string, string | number> = { page, limit };
    if (tableName) { params['tableName'] = tableName; }
    if (entityId) { params['entityId'] = entityId; }
    if (sourceFile) { params['sourceFile'] = sourceFile; }
    return this._http.get<ConflictGroup[]>('/api/conflicts', { params });
  }

  public getEntityDetail(tableName: string, entityId: string): Observable<ConflictEntityDetail> {
    return this._http.get<ConflictEntityDetail>('/api/conflicts/entity', {
      params: { tableName, entityId },
    });
  }

  public resolveConflict(params: ResolveConflictParams): Observable<unknown> {
    return this._http.patch('/api/conflicts/resolve', params);
  }
}
