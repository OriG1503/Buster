import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { UploadSummary } from '@shared/types/upload-summary.type';

@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly _http = inject(HttpClient);

  public upload(file: File, username: string): Observable<UploadSummary> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);
    return this._http.post<UploadSummary>('/api/file', formData);
  }
}
