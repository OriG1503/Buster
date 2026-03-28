import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TableViewQuery } from './table-view/types/table-view-query.type';
import { TableViewResponse } from '../../shared/types/table-view-response.type';

@Injectable({ providedIn: 'root' })
export class TableViewService {
  private readonly _http = inject(HttpClient);

  public query(dto: TableViewQuery): Observable<TableViewResponse> {
    return this._http.post<TableViewResponse>('/api/table-view', dto);
  }
}
