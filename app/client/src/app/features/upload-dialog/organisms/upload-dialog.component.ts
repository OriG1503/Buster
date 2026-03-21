import { Component, inject, signal, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';

import { APP_ROUTES } from '../../../shared/consts/app-routes.consts';

import { UPLOAD_DIALOG_LABEL_MAP } from '../mapping/upload-dialog.label-map';
import { ENTITY_FORMAT_OPTIONS, EntityFormatOption } from '../consts/entity-format-options.consts';
import { UploadedFile } from '../types/uploaded-file.type';
import { FileService } from '../../../core/services/file/file.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [ButtonModule, OverlayPanelModule],
  templateUrl: './upload-dialog.component.html',
  styleUrl: './upload-dialog.component.scss',
})
export class UploadDialogComponent {
  @ViewChild('fileInput') private readonly _fileInputRef!: ElementRef<HTMLInputElement>;

  private readonly _dialogRef = inject(DynamicDialogRef);
  private readonly _fileService = inject(FileService);
  private readonly _authService = inject(AuthService);

  protected readonly _labelMap = UPLOAD_DIALOG_LABEL_MAP;
  protected readonly _formatOptions = ENTITY_FORMAT_OPTIONS;

  protected _$isDragging = signal(false);
  protected _$uploadedFiles = signal<UploadedFile[]>([]);

  public onClose(): void {
    this._dialogRef.close();
  }

  public onConfirm(): void {
    this._dialogRef.close();
  }

  public getConflictsUrl(conflictIds: number[]): string {
    return `${APP_ROUTES.conflicts}?conflictIds=${conflictIds.join(',')}`;
  }

  public onBrowseClick(): void {
    this._fileInputRef.nativeElement.click();
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this._processFiles(Array.from(input.files));
    }
    input.value = '';
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this._$isDragging.set(true);
  }

  public onDragLeave(): void {
    this._$isDragging.set(false);
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this._$isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this._processFiles(Array.from(files));
    }
  }

  public onDownloadTemplate(option: EntityFormatOption, panel: { hide: () => void }): void {
    panel.hide();
    fetch(option.assetPath)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = option.filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      });
  }

  public onDownloadReport(reportFileName: string): void {
    fetch(`/files/${reportFileName}`)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = reportFileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      });
  }

  private _isValidFile(file: File): boolean {
    return /\.(xlsx|xls|csv)$/i.test(file.name);
  }

  private _processFiles(files: File[]): void {
    files.filter((file) => this._isValidFile(file)).forEach((file) => {
      const id = crypto.randomUUID();
      const pending: UploadedFile = { id, name: file.name, successRate: 0, newConflictsCount: 0, conflictIds: [], status: 'pending' };
      this._$uploadedFiles.update((prev) => [...prev, pending]);

      this._fileService.upload(file, this._authService.getPayload()?.email ?? 'unknown').subscribe({
        next: (summary) => {
          this._$uploadedFiles.update((prev) =>
            prev.map((f) =>
              f.id === id
                ? {
                    id,
                    name: file.name,
                    successRate: summary.uploadPercentage,
                    newConflictsCount: summary.conflictCount,
                    conflictIds: summary.conflictIds,
                    status: (summary.conflictCount > 0 || summary.uploadPercentage < 100) ? 'warning' : 'success',
                    reportFileName: summary.uploadPercentage < 100 ? summary.reportFileName : undefined,
                  }
                : f,
            ),
          );
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = err.error?.message ?? err.message ?? 'שגיאה בהעלאת הקובץ';
          this._$uploadedFiles.update((prev) =>
            prev.map((f) => (f.id === id ? { ...f, status: 'error', errorMessage } : f)),
          );
        },
      });
    });
  }
}
