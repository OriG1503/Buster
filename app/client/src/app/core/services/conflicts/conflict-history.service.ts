import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConflictHistoryResponse } from '../../../shared/types/conflict-history-response.type';
import { RevertConflictParams } from '../../../shared/types/revert-conflict-params.type';
import { RelationalHistoryResponse } from '../../../shared/types/relational-history-response.type';

@Injectable({ providedIn: 'root' })
export class ConflictHistoryService {
  private readonly _http = inject(HttpClient);

  public getHistory(tableName: string, entityId: string, columnName: string): Observable<ConflictHistoryResponse> {
    return this._http.get<ConflictHistoryResponse>('/api/conflicts/history', {
      params: { tableName, entityId, columnName },
    });
  }

  public getRelationalHistory(anchorTable: string, anchorId: string, relatedTable: string): Observable<RelationalHistoryResponse> {
    return this._http.get<RelationalHistoryResponse>('/api/conflicts/relational-history', {
      params: { anchorTable, anchorId, relatedTable },
    });
  }

  public revert(params: RevertConflictParams): Observable<unknown> {
    return this._http.patch('/api/conflicts/revert', params);
  }
}
