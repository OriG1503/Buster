import { Component, input, output } from '@angular/core';

import { PopupMetaFieldComponent } from '../../../../shared/atoms/popup-meta-field/popup-meta-field.component';

@Component({
  standalone: true,
  selector: 'app-history-popup-footer',
  imports: [PopupMetaFieldComponent],
  templateUrl: './history-popup-footer.component.html',
  styleUrl: './history-popup-footer.component.scss',
})
export class HistoryPopupFooterComponent {
  public readonly $isEditMode = input<boolean>(false);
  public readonly $isSaving = input<boolean>(false);
  public readonly $resolverName = input<string | null>(null);
  public readonly $resolutionDate = input<string | null>(null);
  public readonly $resolutionNotes = input<string | null>(null);
  /** Shown in edit mode as the acting user. */
  public readonly $editUserName = input<string>('');
  public readonly $editNotes = input<string>('');

  public readonly confirm = output<void>();
  public readonly editNotesChange = output<string>();

}
