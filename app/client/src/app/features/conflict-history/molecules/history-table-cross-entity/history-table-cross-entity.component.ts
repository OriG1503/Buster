import { Component, inject, input, output } from '@angular/core';

import { CrossEntityHistoryEntry, CrossEntityHistoryResponse } from '../../../../shared/types/cross-entity-history-response.type';
import { DisplayNamesService } from '../../../../core/services/display-names/display-names.service';
import { CONFLICT_HISTORY_LABEL_MAP } from '../../mapping/conflict-history.label-map';

@Component({
  standalone: true,
  selector: 'app-history-table-cross-entity',
  templateUrl: './history-table-cross-entity.component.html',
  styleUrl: './history-table-cross-entity.component.scss',
})
export class HistoryTableCrossEntityComponent {
  public readonly $history = input.required<CrossEntityHistoryResponse>();
  public readonly $isEditMode = input<boolean>(false);
  public readonly $pendingWinnerValue = input<string | null>(null);
  public readonly $sourceLabel = input.required<string>();
  public readonly $sourceTimeLabel = input.required<string>();
  public readonly $notesLabel = input.required<string>();

  public readonly entrySelected = output<string | null>();

  private readonly _displayNames = inject(DisplayNamesService);

  protected readonly VALUE_HEADER = CONFLICT_HISTORY_LABEL_MAP.valueHeader;

  protected getEntityBadge(entry: CrossEntityHistoryEntry): string {
    return this._displayNames.getEntityName(entry.entityTable);
  }

  protected formatDate(iso: string | null): string {
    if (!iso) { return '—'; }
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
