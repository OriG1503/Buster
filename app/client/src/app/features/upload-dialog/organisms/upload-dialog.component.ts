import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';

import { APP_ROUTES } from '../../../shared/consts/app-routes.consts';
import { UPLOAD_DIALOG_LABEL_MAP } from '../mapping/upload-dialog.label-map';
import { FORMAT_OPTION_ASSET_PATHS } from '../consts/upload-dialog.consts';
import { UploadedFile } from '../types/uploaded-file.type';
import { EntityFormatOption } from '../types/entity-format-option.type';
import { FileService } from '../../../core/services/file/file.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { DisplayNamesService } from '../../../core/services/display-names/display-names.service';
import { DownloadService } from '../services/download.service';
import { UploadDropzoneComponent } from '../molecules/upload-dropzone/upload-dropzone.component';
import { UploadFileRowComponent } from '../molecules/upload-file-row/upload-file-row.component';
import { UploadSummary } from '../../../shared/types/upload-summary.type';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [ButtonModule, OverlayPanelModule, UploadDropzoneComponent, UploadFileRowComponent],
  templateUrl: './upload-dialog.component.html',
  styleUrl: './upload-dialog.component.scss',
})
export class UploadDialogComponent {
  private readonly _dialogRef = inject(DynamicDialogRef);
  private readonly _fileService = inject(FileService);
  private readonly _authService = inject(AuthService);
  private readonly _displayNames = inject(DisplayNamesService);
  private readonly _downloadService = inject(DownloadService);

  protected readonly _labelMap = UPLOAD_DIALOG_LABEL_MAP;
  protected readonly _$uploadedFiles = signal<UploadedFile[]>([]);

  /** Format options with dynamic labels from the server config. */
  protected readonly _$formatOptions = computed<EntityFormatOption[]>(() =>
    Object.entries(FORMAT_OPTION_ASSET_PATHS).map(([tableName, paths]) => ({
      ...paths,
      label: `פורמט ${this._displayNames.getEntityPluralName(tableName)}`,
    })),
  );

  public onClose(): void {
    this._dialogRef.close();
  }

  public onConfirm(): void {
    this._dialogRef.close();
  }

  public onViewConflicts(conflictIds: number[]): void {
    window.open(`${APP_ROUTES.conflicts}?conflictIds=${conflictIds.join(',')}`, '_blank');
  }

  public onDownloadTemplate(option: EntityFormatOption, panel: { hide: () => void }): void {
    panel.hide();
    this._downloadService.downloadFromUrl(option.assetPath, option.filename);
  }

  public onDownloadReport(reportFileName: string): void {
    this._downloadService.downloadFromUrl(`/api/file/report/${reportFileName}`, reportFileName);
  }

  public onFilesDropped(files: File[]): void {
    files.filter((file) => this._isValidFile(file)).forEach((file) => this._uploadFile(file));
  }

  private _isValidFile(file: File): boolean {
    return /\.(xlsx|xls|csv)$/i.test(file.name);
  }

  private _uploadFile(file: File): void {
    const id = crypto.randomUUID();
    this._$uploadedFiles.update((prev) => [...prev, { id, name: file.name, successRate: 0, newConflictsCount: 0, conflictIds: [], status: 'pending' }]);

    this._fileService.upload(file, this._authService.getPayload()?.email ?? 'unknown').subscribe({
      next: (summary) => this._onUploadSuccess(id, file.name, summary),
      error: (err: HttpErrorResponse) => this._onUploadError(id, err),
    });
  }

  private _onUploadSuccess(id: string, name: string, summary: UploadSummary): void {
    this._$uploadedFiles.update((prev) =>
      prev.map((f) => f.id !== id ? f : {
        id,
        name,
        successRate: summary.uploadPercentage,
        newConflictsCount: summary.conflictCount,
        conflictIds: summary.conflictIds,
        status: (summary.conflictCount > 0 || summary.uploadPercentage < 100) ? 'warning' : 'success',
        reportFileName: summary.reportFileName,
        unknownColumns: summary.unknownColumns.length > 0 ? summary.unknownColumns : undefined,
      }),
    );
  }

  private _onUploadError(id: string, err: HttpErrorResponse): void {
    const errorMessage = err.error?.message ?? err.message ?? 'שגיאה בהעלאת הקובץ';
    this._$uploadedFiles.update((prev) =>
      prev.map((f) => f.id !== id ? f : { ...f, status: 'error', errorMessage }),
    );
  }
}
