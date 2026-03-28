import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConflictHistoryResponse } from '../../../shared/types/conflict-history-response.type';
import { RelationalHistoryResponse } from '../../../shared/types/relational-history-response.type';
import { API_ROUTES } from '../../../shared/consts/api-routes.consts';
import { RevertConflictParams } from './types/revert-conflict-params.type';

@Injectable({ providedIn: 'root' })
export class ConflictHistoryService {
  private readonly _http = inject(HttpClient);

  public getHistory(tableName: string, entityId: string, columnName: string): Observable<ConflictHistoryResponse> {
    return this._http.get<ConflictHistoryResponse>(API_ROUTES.conflicts.history, {
      params: { tableName, entityId, columnName },
    });
  }

  public getRelationalHistory(anchorTable: string, anchorId: string, relatedTable: string): Observable<RelationalHistoryResponse> {
    return this._http.get<RelationalHistoryResponse>(API_ROUTES.conflicts.relationalHistory, {
      params: { anchorTable, anchorId, relatedTable },
    });
  }

  public revert(params: RevertConflictParams): Observable<unknown> {
    return this._http.patch(API_ROUTES.conflicts.revert, params);
  }
}
