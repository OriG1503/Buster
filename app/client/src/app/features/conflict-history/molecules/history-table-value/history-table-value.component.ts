import { Component, input, output } from '@angular/core';

import { ConflictHistoryResponse } from '../../../../shared/types/conflict-history-response.type';
import { CONFLICT_HISTORY_LABEL_MAP } from '../../mapping/conflict-history.label-map';

@Component({
  standalone: true,
  selector: 'app-history-table-value',
  templateUrl: './history-table-value.component.html',
  styleUrl: './history-table-value.component.scss',
})
export class HistoryTableValueComponent {
  public readonly $history = input.required<ConflictHistoryResponse>();
  public readonly $isEditMode = input<boolean>(false);
  public readonly $pendingWinnerValue = input<string | null>(null);
  public readonly $sourceLabel = input.required<string>();
  public readonly $sourceTimeLabel = input.required<string>();
  public readonly $notesLabel = input.required<string>();

  public readonly entrySelected = output<string | null>();

  protected readonly VALUE_HEADER = CONFLICT_HISTORY_LABEL_MAP.valueHeader;
  protected readonly UPLOADED_AT_HEADER = CONFLICT_HISTORY_LABEL_MAP.uploadedAtHeader;

  protected formatDate(iso: string | null): string {
    if (!iso) { return '—'; }
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
