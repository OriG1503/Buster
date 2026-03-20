import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { ConflictHistoryService } from '../../../../core/services/conflict-history.service';
import { ConflictHistoryResponse } from '../../../../shared/types/conflict-history-response.type';
import { HistoryTarget } from '../../../../shared/types/history-target.type';

@Component({
  selector: 'app-conflict-history-popup',
  imports: [],
  templateUrl: './conflict-history-popup.component.html',
  styleUrl: './conflict-history-popup.component.scss',
})
export class ConflictHistoryPopupComponent {
  public readonly $target = input.required<HistoryTarget>();
  public readonly closed = output<void>();

  private readonly _historyService = inject(ConflictHistoryService);

  protected readonly _$history = signal<ConflictHistoryResponse | null>(null);
  protected readonly _$isLoading = signal(true);
  protected readonly _$isError = signal(false);

  protected readonly _$panelStyle = computed(() => {
    const { anchorBottom, anchorCenterX } = this.$target();
    const popupWidth = 480;
    const gap = 8;
    const top = anchorBottom + gap;
    const left = Math.max(8, Math.min(anchorCenterX - popupWidth / 2, window.innerWidth - popupWidth - 8));
    return { top: `${top}px`, left: `${left}px` };
  });

  public constructor() {
    effect(() => {
      const target = this.$target();
      this._$isLoading.set(true);
      this._$isError.set(false);
      this._$history.set(null);
      this._historyService.getHistory(target.tableName, target.entityId, target.columnName).subscribe({
        next: (response) => {
          this._$history.set(response);
          this._$isLoading.set(false);
        },
        error: () => {
          this._$isError.set(true);
          this._$isLoading.set(false);
        },
      });
    });
  }

  public onClose(): void {
    this.closed.emit();
  }

  protected formatDate(iso: string | null): string {
    if (!iso) {
      return 'N/A';
    }
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

}
