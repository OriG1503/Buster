import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConflictGroup } from '../../../shared/types/conflict-group.type';
import { ConflictEntityDetail } from '../../../shared/types/conflict-entity-detail.type';
import { API_ROUTES } from '../../../shared/consts/api-routes.consts';
import { ConflictCountResponse } from './types/conflict-count-response.type';
import { ResolveValueConflictParams } from './types/resolve-value-conflict-params.type';
import { ResolveRelationalConflictParams } from './types/resolve-relational-conflict-params.type';
import { ResolveCrossEntityConflictParams } from './types/resolve-cross-entity-conflict-params.type';

@Injectable({ providedIn: 'root' })
export class ConflictsService {
  private readonly _http = inject(HttpClient);

  public getCount(): Observable<ConflictCountResponse> {
    return this._http.get<ConflictCountResponse>(API_ROUTES.conflicts.count);
  }

  public getList(
    page: number,
    limit: number,
    tableName?: string,
    entityId?: string,
    conflictIds?: number[],
    date?: string,
  ): Observable<ConflictGroup[]> {
    const params: Record<string, string | number> = { page, limit };
    if (tableName) { params['tableName'] = tableName; }
    if (entityId) { params['entityId'] = entityId; }
    if (conflictIds?.length) { params['conflictIds'] = conflictIds.join(','); }
    if (date) { params['date'] = date; }
    return this._http.get<ConflictGroup[]>(API_ROUTES.conflicts.list, { params });
  }

  public getEntityDetail(tableName: string, entityId: string): Observable<ConflictEntityDetail> {
    return this._http.get<ConflictEntityDetail>(API_ROUTES.conflicts.entity, {
      params: { tableName, entityId },
    });
  }

  public resolveConflict(params: ResolveValueConflictParams): Observable<unknown> {
    return this._http.patch(API_ROUTES.conflicts.resolveValue, params);
  }

  public resolveRelationalConflict(params: ResolveRelationalConflictParams): Observable<unknown> {
    return this._http.patch(API_ROUTES.conflicts.resolveRelational, params);
  }

  public resolveCrossEntityConflict(params: ResolveCrossEntityConflictParams): Observable<unknown> {
    return this._http.patch(API_ROUTES.conflicts.resolveCrossEntity, params);
  }

  public checkOpenIds(ids: string[]): Observable<string[]> {
    return this._http.post<string[]>(API_ROUTES.conflicts.openIds, { ids });
  }
}
