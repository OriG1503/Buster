import { Component, input, output } from '@angular/core';

import { UploadedFile } from '../../types/uploaded-file.type';
import { UPLOAD_DIALOG_LABEL_MAP } from '../../mapping/upload-dialog.label-map';

@Component({
  standalone: true,
  selector: 'app-upload-file-row',
  templateUrl: './upload-file-row.component.html',
  styleUrl: './upload-file-row.component.scss',
})
export class UploadFileRowComponent {
  public readonly $file = input.required<UploadedFile>();

  public readonly viewConflicts = output<number[]>();
  public readonly downloadReport = output<string>();

  protected readonly _labelMap = UPLOAD_DIALOG_LABEL_MAP;
}
