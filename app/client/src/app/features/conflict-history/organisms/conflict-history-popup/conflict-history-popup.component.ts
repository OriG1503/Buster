import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { ConflictHistoryService } from '../../../../core/services/conflicts/conflict-history.service';
import { HistoryPopupFooterComponent } from '../../molecules/history-popup-footer/history-popup-footer.component';
import { ConflictHistoryResponse } from '../../../../shared/types/conflict-history-response.type';
import { RelationalHistoryAnchor, RelationalHistoryGroup, RelationalHistoryResponse } from '../../../../shared/types/relational-history-response.type';
import { HistoryTarget } from '../../../../shared/types/history-target.type';
import { ToastService } from '../../../../shared/services/toast.service';
import { DisplayNamesService } from '../../../../core/services/display-names/display-names.service';
import { DEFAULT_USER_NAME } from '../../../../shared/consts/default-user.consts';
import { PermissionsService } from '../../../../core/services/permissions/permissions.service';
import { CONFLICT_HISTORY_LABEL_MAP } from '../../mapping/conflict-history.label-map';

@Component({
  selector: 'app-conflict-history-popup',
  imports: [HistoryPopupFooterComponent],
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
  protected readonly _$isLoading = signal(true);
  protected readonly _$isError = signal(false);
  protected readonly _$isEditMode = signal(false);
  protected readonly _$pendingWinnerValue = signal<string | null>(null);
  protected readonly _$editNotes = signal('');
  protected readonly _$isSaving = signal(false);
  protected readonly _defaultUserName = DEFAULT_USER_NAME;

  protected readonly _$isRelational = computed(() => this.$target().isRelational);
  protected readonly _$canEdit = computed(() => this._permissionsService.canEdit());

  private readonly _$tableName = computed(() => {
    const target = this.$target();
    return target.isRelational ? target.anchorTable : target.tableName;
  });

  protected readonly _$sourceLabel = computed(() => this._displayNames.getColumnLabel(this._$tableName(), 'source'));
  protected readonly _$sourceTimeLabel = computed(() => this._displayNames.getColumnLabel(this._$tableName(), 'sourceTime'));
  protected readonly _$notesLabel = computed(() => this._displayNames.getColumnLabel(this._$tableName(), 'notes'));
  protected readonly VALUE_HEADER = CONFLICT_HISTORY_LABEL_MAP.valueHeader;
  protected readonly UPLOADED_AT_HEADER = CONFLICT_HISTORY_LABEL_MAP.uploadedAtHeader;


  protected readonly _$panelStyle = computed(() => {
    const { anchorTop, anchorBottom, anchorCenterX } = this.$target();
    const popupWidth = this._$isRelational() ? 700 : 480;
    const gap = 8;
    const screenMargin = 8;
    const left = Math.max(screenMargin, Math.min(anchorCenterX - popupWidth / 2, window.innerWidth - popupWidth - screenMargin));
    const spaceBelow = window.innerHeight - anchorBottom - gap;
    // Flip above the anchor when there isn't enough space below (use a rough min-height estimate)
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

      if (target.isRelational) {
        this._historyService.getRelationalHistory(target.anchorTable, target.anchorId, target.relatedTable).subscribe({
          next: (response) => {
            this._$relationalHistory.set(response);
            this._$isLoading.set(false);
          },
          error: () => {
            this._$isError.set(true);
            this._$isLoading.set(false);
          },
        });
      } else {
        this._historyService.getHistory(target.tableName, target.entityId, target.columnName).subscribe({
          next: (response) => {
            this._$valueHistory.set(response);
            this._$isLoading.set(false);
          },
          error: () => {
            this._$isError.set(true);
            this._$isLoading.set(false);
          },
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
    const currentWinner = this._$valueHistory()?.entries.find((entry) => entry.isWinner)?.value ?? null;
    this._$pendingWinnerValue.set(currentWinner);
    this._$editNotes.set('');
    this._$isEditMode.set(true);
  }

  public onEntryDotClick(value: string | null): void {
    if (!this._$isEditMode()) {
      return;
    }
    this._$pendingWinnerValue.set(value);
  }

  public onClose(): void {
    if (!this._$isEditMode()) {
      this.closed.emit();
      return;
    }

    const currentWinner = this._$valueHistory()?.entries.find((entry) => entry.isWinner)?.value ?? null;
    const pendingValue = this._$pendingWinnerValue();

    if (pendingValue === null || pendingValue === currentWinner) {
      this._$isEditMode.set(false);
      this._$editNotes.set('');
      this.closed.emit();
      return;
    }

    const target = this.$target();
    if (target.isRelational) {
      return;
    }

    const { tableName, entityId, columnName } = target;
    this._$isSaving.set(true);
    this._historyService
      .revert({
        tableName,
        entityId,
        columnName,
        revertValue: pendingValue,
        revertedBy: DEFAULT_USER_NAME,
        resolutionNotes: this._$editNotes(),
      })
      .subscribe({
        next: () => {
          this._$isSaving.set(false);
          this._$editNotes.set('');
          this._toastService.show('הערך עודכן בהצלחה', 'success');
          this.reverted.emit();
          this.closed.emit();
        },
        error: () => {
          this._$isSaving.set(false);
          this._toastService.show('שגיאה בעדכון הערך', 'error');
        },
      });
  }

  protected getEntityName(tableName: string): string {
    return this._displayNames.getEntityName(tableName);
  }

  protected getAnchorFieldKeys(anchor: RelationalHistoryAnchor): string[] {
    return Object.keys(anchor.fields);
  }

  protected getAnchorFieldLabel(tableName: string, field: string): string {
    return this._displayNames.getColumnLabel(tableName, field);
  }

  protected getGroupLabel(group: RelationalHistoryGroup): string {
    return `אופציות ${this._displayNames.getEntityName(group.relatedTable)}`;
  }

  protected getGroupSubtreeFields(group: RelationalHistoryGroup): string[] {
    const fields = new Set<string>();
    group.options.forEach((opt) => Object.keys(opt.subtreeIds).forEach((field) => fields.add(field)));
    return [...fields];
  }

  protected getSubtreeFieldLabel(relatedTable: string, fkField: string): string {
    return this._displayNames.getColumnLabel(relatedTable, fkField);
  }

  protected formatDate(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
