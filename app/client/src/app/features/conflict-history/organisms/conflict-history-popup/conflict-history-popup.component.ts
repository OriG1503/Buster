import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { ConflictHistoryService } from '../../../../core/services/conflicts/conflict-history.service';
import { HistoryPopupFooterComponent } from '../../molecules/history-popup-footer/history-popup-footer.component';
import { HistoryTableValueComponent } from '../../molecules/history-table-value/history-table-value.component';
import { HistoryTableCrossEntityComponent } from '../../molecules/history-table-cross-entity/history-table-cross-entity.component';
import { HistoryTableRelationalComponent } from '../../molecules/history-table-relational/history-table-relational.component';
import { ConflictHistoryResponse } from '../../../../shared/types/conflict-history-response.type';
import { RelationalHistoryResponse } from '../../../../shared/types/relational-history-response.type';
import { CrossEntityHistoryResponse } from '../../../../shared/types/cross-entity-history-response.type';
import { HistoryTarget } from '../../../../shared/types/history-target.type';
import { ToastService } from '../../../../shared/services/toast.service';
import { DisplayNamesService } from '../../../../core/services/display-names/display-names.service';
import { DEFAULT_USER_NAME } from '../../../../shared/consts/default-user.consts';
import { PermissionsService } from '../../../../core/services/permissions/permissions.service';

@Component({
  selector: 'app-conflict-history-popup',
  imports: [HistoryPopupFooterComponent, HistoryTableValueComponent, HistoryTableCrossEntityComponent, HistoryTableRelationalComponent],
  templateUrl: './conflict-history-popup.component.html',
  styleUrl: './conflict-history-popup.component.scss',
})
export class ConflictHistoryPopupComponent {
  public readonly $target = input.required<HistoryTarget>();
  public readonly closed = output<void>();
  public readonly reverted = output<void>();

  private readonly _historyService = inject(ConflictHistoryService);
  private readonly _toastService = inject(ToastService);
  private readonly _permissionsService = inject(PermissionsService);
  private readonly _displayNames = inject(DisplayNamesService);

  protected readonly _$valueHistory = signal<ConflictHistoryResponse | null>(null);
  protected readonly _$relationalHistory = signal<RelationalHistoryResponse | null>(null);
  protected readonly _$crossEntityHistory = signal<CrossEntityHistoryResponse | null>(null);
  protected readonly _$isLoading = signal(true);
  protected readonly _$isError = signal(false);
  protected readonly _$isEditMode = signal(false);
  protected readonly _$pendingWinnerValue = signal<string | null>(null);
  protected readonly _$editNotes = signal('');
  protected readonly _$isSaving = signal(false);
  protected readonly _defaultUserName = DEFAULT_USER_NAME;

  protected readonly _$isRelational = computed(() => this.$target().isRelational);
  protected readonly _$isCrossEntity = computed(() => !this.$target().isRelational && !!(this.$target() as any).isCrossEntity);
  protected readonly _$canEdit = computed(() => this._permissionsService.canEdit());

  private readonly _$tableName = computed(() => {
    const target = this.$target();
    return target.isRelational ? target.anchorTable : target.tableName;
  });

  protected readonly _$sourceLabel = computed(() => this._displayNames.getColumnLabel(this._$tableName(), 'source'));
  protected readonly _$sourceTimeLabel = computed(() => this._displayNames.getColumnLabel(this._$tableName(), 'sourceTime'));
  protected readonly _$notesLabel = computed(() => this._displayNames.getColumnLabel(this._$tableName(), 'notes'));

  protected readonly _$panelStyle = computed(() => {
    const { anchorTop, anchorBottom, anchorCenterX } = this.$target();
    const popupWidth = this._$isRelational() ? 700 : 480;
    const gap = 8;
    const screenMargin = 8;
    const left = Math.max(screenMargin, Math.min(anchorCenterX - popupWidth / 2, window.innerWidth - popupWidth - screenMargin));
    const spaceBelow = window.innerHeight - anchorBottom - gap;
    const minPopupHeight = 220;
    if (spaceBelow < minPopupHeight && anchorTop > minPopupHeight) {
      return { top: 'auto', bottom: `${window.innerHeight - anchorTop + gap}px`, left: `${left}px`, width: `${popupWidth}px` };
    }
    return { top: `${anchorBottom + gap}px`, bottom: 'auto', left: `${left}px`, width: `${popupWidth}px` };
  });

  public constructor() {
    effect(() => {
      const target = this.$target();
      this._$isLoading.set(true);
      this._$isError.set(false);
      this._$isEditMode.set(false);
      this._$pendingWinnerValue.set(null);
      this._$editNotes.set('');
      this._$valueHistory.set(null);
      this._$relationalHistory.set(null);
      this._$crossEntityHistory.set(null);

      if (target.isRelational) {
        this._historyService.getRelationalHistory(target.anchorTable, target.anchorId, target.relatedTable).subscribe({
          next: (response) => { this._$relationalHistory.set(response); this._$isLoading.set(false); },
          error: () => { this._$isError.set(true); this._$isLoading.set(false); },
        });
      } else if ((target as any).isCrossEntity) {
        this._historyService.getCrossEntityHistory(target.tableName, target.entityId, target.columnName).subscribe({
          next: (response) => { this._$crossEntityHistory.set(response); this._$isLoading.set(false); },
          error: () => { this._$isError.set(true); this._$isLoading.set(false); },
        });
      } else {
        this._historyService.getHistory(target.tableName, target.entityId, target.columnName).subscribe({
          next: (response) => { this._$valueHistory.set(response); this._$isLoading.set(false); },
          error: () => { this._$isError.set(true); this._$isLoading.set(false); },
        });
      }
    });
  }

  public onEditClick(): void {
    if (this._$isEditMode()) {
      this._$isEditMode.set(false);
      this._$editNotes.set('');
      return;
    }
    const currentWinner =
      this._$valueHistory()?.entries.find((e) => e.isWinner)?.value ??
      this._$crossEntityHistory()?.entries.find((e) => e.isWinner)?.value ??
      null;
    this._$pendingWinnerValue.set(currentWinner);
    this._$editNotes.set('');
    this._$isEditMode.set(true);
  }

  public onEntryDotClick(value: string | null): void {
    if (!this._$isEditMode()) { return; }
    this._$pendingWinnerValue.set(value);
  }

  public onClose(): void {
    if (!this._$isEditMode()) {
      this.closed.emit();
      return;
    }

    const target = this.$target();
    if (target.isRelational) { return; }

    const pendingValue = this._$pendingWinnerValue();

    if (this._$isCrossEntity()) {
      const currentWinner = this._$crossEntityHistory()?.entries.find((e) => e.isWinner)?.value ?? null;
      if (pendingValue === null || pendingValue === currentWinner) {
        this._$isEditMode.set(false);
        this._$editNotes.set('');
        this.closed.emit();
        return;
      }
      const { tableName, entityId, columnName } = target as { tableName: string; entityId: string; columnName: string };
      this._$isSaving.set(true);
      this._historyService
        .revertCrossEntity({ tableName, entityId, columnName, revertValue: pendingValue, revertedBy: DEFAULT_USER_NAME, resolutionNotes: this._$editNotes() })
        .subscribe({
          next: () => { this._$isSaving.set(false); this._$editNotes.set(''); this._toastService.show('הערך עודכן בהצלחה', 'success'); this.reverted.emit(); this.closed.emit(); },
          error: () => { this._$isSaving.set(false); this._toastService.show('שגיאה בעדכון הערך', 'error'); },
        });
      return;
    }

    const currentWinner = this._$valueHistory()?.entries.find((e) => e.isWinner)?.value ?? null;
    if (pendingValue === null || pendingValue === currentWinner) {
      this._$isEditMode.set(false);
      this._$editNotes.set('');
      this.closed.emit();
      return;
    }

    const { tableName, entityId, columnName } = target as { tableName: string; entityId: string; columnName: string };
    this._$isSaving.set(true);
    this._historyService
      .revert({ tableName, entityId, columnName, revertValue: pendingValue, revertedBy: DEFAULT_USER_NAME, resolutionNotes: this._$editNotes() })
      .subscribe({
        next: () => { this._$isSaving.set(false); this._$editNotes.set(''); this._toastService.show('הערך עודכן בהצלחה', 'success'); this.reverted.emit(); this.closed.emit(); },
        error: () => { this._$isSaving.set(false); this._toastService.show('שגיאה בעדכון הערך', 'error'); },
      });
  }

  protected formatDate(iso: string | null): string {
    if (!iso) { return '—'; }
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
