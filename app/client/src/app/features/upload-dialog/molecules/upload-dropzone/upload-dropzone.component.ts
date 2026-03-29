import { Component, signal, output } from '@angular/core';

import { UPLOAD_DIALOG_LABEL_MAP } from '../../mapping/upload-dialog.label-map';

@Component({
  standalone: true,
  selector: 'app-upload-dropzone',
  templateUrl: './upload-dropzone.component.html',
  styleUrl: './upload-dropzone.component.scss',
})
export class UploadDropzoneComponent {
  public readonly filesDropped = output<File[]>();

  protected readonly _labelMap = UPLOAD_DIALOG_LABEL_MAP;
  protected readonly _$isDragging = signal(false);

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this._$isDragging.set(true);
  }

  protected onDragLeave(): void {
    this._$isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this._$isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) { this.filesDropped.emit(Array.from(files)); }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) { this.filesDropped.emit(Array.from(input.files)); }
    input.value = '';
  }

  protected onBrowseClick(fileInput: HTMLInputElement): void {
    fileInput.click();
  }
}
