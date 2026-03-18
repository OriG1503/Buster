import { Injectable, inject } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';

import { UploadDialogComponent } from '../../../features/upload-dialog/organisms/upload-dialog.component';

@Injectable({ providedIn: 'root' })
export class UploadDialogService {
  private readonly _dialogService = inject(DialogService);

  public open(): void {
    this._dialogService.open(UploadDialogComponent, {
      width: '560px',
      modal: true,
      closable: false,
      showHeader: false,
      contentStyle: { padding: '0', 'border-radius': '0.75rem' },
      
    });
  }
}
