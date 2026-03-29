import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { ConflictColumnDetail, ConflictEntityDetail, RelationalConflictDetail, TwoFathersConflictDetail } from '../../../../shared/types/conflict-entity-detail.type';
import { ConflictGroup } from '../../../../shared/types/conflict-group.type';
import { ConflictsService } from '../../../../core/services/conflicts/conflicts.service';
import { ConflictsStore } from '../../../../core/store/conflicts.store';
import { HomeStore } from '../../../../core/store/home.store';
import { DisplayNamesService } from '../../../../core/services/display-names/display-names.service';
import { PermissionsService } from '../../../../core/services/permissions/permissions.service';
import { ENTITY_COLUMN_TREE } from '../../../../shared/consts/entity-column-tree.consts';
import { DEFAULT_USER_NAME } from '../../../../shared/consts/default-user.consts';
import { PendingResolution, PendingValueResolution, PendingRelationalResolution } from '../../types/pending-resolution.type';
import { ConflictOptionBtnComponent } from '../../molecules/conflict-option-btn/conflict-option-btn.component';
import { FloatingWarningDialogComponent } from '../../molecules/floating-warning-dialog/floating-warning-dialog.component';
import { FADE_SLIDE_IN_ANIMATION, SLIDE_DOWN_ANIMATION } from './conflict-item.consts';
import { CONFLICTS_LABEL_MAP } from '../../mapping/conflicts.label-map';

@Component({
  selector: 'app-conflict-item',
  standalone: true,
  imports: [ConflictOptionBtnComponent, FloatingWarningDialogComponent],
  templateUrl: './conflict-item.component.html',
  styleUrl: './conflict-item.component.scss',
  animations: [SLIDE_DOWN_ANIMATION, FADE_SLIDE_IN_ANIMATION],
})
export class ConflictItemComponent {
  public readonly $group = input.required<ConflictGroup>();
  public readonly $isOpen = input<boolean>(false);
  public readonly toggled = output<string | null>();

  private readonly _conflictsService = inject(ConflictsService);
  private readonly _conflictsStore = inject(ConflictsStore);
  private readonly _homeStore = inject(HomeStore);
  private readonly _permissionsService = inject(PermissionsService);
  private readonly _displayNames = inject(DisplayNamesService);

  protected readonly _isExpanded = signal(false);
  protected readonly _$detail = signal<ConflictEntityDetail | null>(null);
  protected readonly _$notes = signal('');
  protected readonly _$pendingResolution = signal<PendingResolution | null>(null);
  protected readonly _$openConflictIds = signal<Set<string>>(new Set());
  protected readonly _$showFloatingWarning = signal(false);
  protected readonly _$confirmedRelational = signal<PendingRelationalResolution | null>(null);

  protected readonly _$allColumns = computed<ConflictColumnDetail[]>(() => {
    const detail = this._$detail();
    if (!detail) { return []; }
    const detailMap = new Map(detail.columns.map((col) => [col.columnName, col]));
    const tableName = this.$group().tableName;
    const columnKeys = ENTITY_COLUMN_TREE[tableName]?.[0]?.columns ?? [];
    // Map ordered keys to detail entries, preserving the canonical column order
    return columnKeys
      .map((key) => key.split('.')[1])
      .map((columnName) => detailMap.get(columnName))
      .filter((col): col is ConflictColumnDetail => col !== undefined);
  });

  protected readonly _$pkColumn = computed(() =>
    this._$allColumns().find((col) => col.columnName === 'id') ?? null,
  );
  protected readonly _$twoFathersConflict = computed(() => this._$detail()?.twoFathersConflict ?? null);
  protected readonly _$twoChildsConflicts = computed(() =>
    this._$allColumns().filter((col) => col.relationalConflict?.conflictType === 'TWO_CHILDS'),
  );
  protected readonly _$valueConflictColumns = computed(() =>
    this._$allColumns().filter((col) => col.isConflicted),
  );
  protected readonly _$regularColumns = computed(() =>
    this._$allColumns().filter((col) => !col.isConflicted && !col.relationalConflict && col.columnName !== 'id'),
  );
  protected readonly _$canResolve = computed(() => {
    const resolution = this._$pendingResolution();
    if (!resolution || !this._$notes().trim()) { return false; }
    if (resolution.type === 'value' || resolution.type === 'twoFathers') { return true; }
    return [...resolution.subtreeLevels.values()].every((v) => !!v);
  });
  protected readonly _$canEdit = computed(() => this._permissionsService.canEdit());
  protected readonly _$sourceLabel = computed(() => this._displayNames.getColumnLabel(this.$group().tableName, 'source'));
  protected readonly _$sourceTimeLabel = computed(() => this._displayNames.getColumnLabel(this.$group().tableName, 'sourceTime'));
  protected readonly UPLOADED_LABEL = CONFLICTS_LABEL_MAP.uploadedAtLabel;

  public constructor() {
    effect(() => {
      if (this.$isOpen() && !this._isExpanded()) {
        this._isExpanded.set(true);
        if (!this._$detail()) { this._loadDetail(); }
      }
    });
  }

  public toggle(): void {
    this._isExpanded.update((v) => !v);
    if (this._isExpanded()) {
      if (!this._$detail()) { this._loadDetail(); }
      this.toggled.emit(this.$group().entityId);
    } else {
      this.toggled.emit(null);
    }
  }

  protected isIdOpen(id: string): boolean {
    return this._$openConflictIds().has(id);
  }

  protected getLabel(columnName: string): string {
    return this._displayNames.getColumnLabel(this.$group().tableName, columnName);
  }

  protected getEntityLabel(): string {
    return this._displayNames.getEntityName(this.$group().tableName);
  }

  protected getFathersColumnLabel(rc: TwoFathersConflictDetail): string {
    return `מזהה ${this._displayNames.getEntityName(rc.relatedTable)}`;
  }

  protected formatDate(isoDate: string | null): string {
    if (!isoDate) { return '—'; }
    return new Date(isoDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  protected getSubtreeFkFields(rc: RelationalConflictDetail): string[] {
    const allFkFields = new Set<string>();
    rc.options.forEach((opt) => { Object.keys(opt.childData).forEach((f) => allFkFields.add(f)); });
    // Only show FK fields that differ across options (the conflicting ones)
    return [...allFkFields].filter((field) => {
      const uniqueVals = new Set(rc.options.map((opt) => opt.childData[field]));
      return uniqueVals.size > 1;
    });
  }

  protected getSubtreeOptions(rc: RelationalConflictDetail, fkField: string): string[] {
    return [...new Set(rc.options.map((opt) => opt.childData[fkField]).filter((id): id is string => !!id))];
  }

  protected getSubtreeFkLabel(rc: RelationalConflictDetail, fkField: string): string {
    return this._displayNames.getColumnLabel(rc.relatedTable, fkField);
  }

  // --- Value conflict ---

  protected selectValueWinner(columnName: string, value: string | null): void {
    if (!value) { return; }
    this._$pendingResolution.update((prev) => {
      if (prev?.type === 'value' && prev.columnName === columnName && prev.winnerValue === value) { return null; }
      return { type: 'value', columnName, winnerValue: value };
    });
  }

  protected isValueWinnerSelected(columnName: string, value: string | null): boolean {
    const res = this._$pendingResolution();
    return res?.type === 'value' && res.columnName === columnName && res.winnerValue === value;
  }

  // --- TWO_CHILDS ---

  protected selectTwoChildsWinner(columnName: string, rc: RelationalConflictDetail, winnerId: string): void {
    this._$pendingResolution.update((prev) => {
      const relPrev = prev as PendingRelationalResolution | null;
      if (relPrev?.type === 'twoChilds' && relPrev.columnName === columnName && relPrev.winnerRelatedId === winnerId) { return null; }
      const subtreeFields = this.getSubtreeFkFields(rc);
      return {
        type: 'twoChilds',
        columnName,
        conflictIds: rc.conflictIds,
        winnerRelatedId: winnerId,
        subtreeLevels: new Map(subtreeFields.map((f) => [f, ''] as [string, string])),
      };
    });
  }

  protected isTwoChildsWinnerSelected(columnName: string, id: string): boolean {
    const res = this._$pendingResolution();
    return res?.type === 'twoChilds' && (res as PendingRelationalResolution).columnName === columnName &&
      (res as PendingRelationalResolution).winnerRelatedId === id;
  }

  protected selectSubtreeLevel(columnName: string, fkField: string, childId: string): void {
    this._$pendingResolution.update((prev) => {
      const relPrev = prev as PendingRelationalResolution | null;
      if (!relPrev || relPrev.type !== 'twoChilds' || relPrev.columnName !== columnName) { return prev; }
      const newLevels = new Map(relPrev.subtreeLevels);
      newLevels.set(fkField, newLevels.get(fkField) === childId ? '' : childId);
      return { ...relPrev, subtreeLevels: newLevels };
    });
  }

  protected isSubtreeLevelSelected(columnName: string, fkField: string, childId: string): boolean {
    const res = this._$pendingResolution();
    if (!res || res.type !== 'twoChilds' || (res as PendingRelationalResolution).columnName !== columnName) { return false; }
    return (res as PendingRelationalResolution).subtreeLevels.get(fkField) === childId;
  }

  // --- TWO_FATHERS ---

  protected selectTwoFathersWinner(rc: TwoFathersConflictDetail, winnerId: string): void {
    this._$pendingResolution.update((prev) => {
      const relPrev = prev as PendingRelationalResolution | null;
      if (relPrev?.type === 'twoFathers' && relPrev.winnerRelatedId === winnerId) { return null; }
      return { type: 'twoFathers', columnName: '__twoFathers__', conflictIds: rc.conflictIds, winnerRelatedId: winnerId, subtreeLevels: new Map() };
    });
  }

  protected isTwoFathersWinnerSelected(id: string): boolean {
    const res = this._$pendingResolution();
    return res?.type === 'twoFathers' && (res as PendingRelationalResolution).winnerRelatedId === id;
  }

  // --- Resolution submit ---

  public resolve(): void {
    if (!this._$canResolve()) { return; }
    const resolution = this._$pendingResolution()!;
    if (resolution.type === 'value') {
      this._submitValueResolution(resolution);
    } else {
      this._$confirmedRelational.set(resolution as PendingRelationalResolution);
      this._$showFloatingWarning.set(true);
    }
  }

  protected confirmResolution(): void {
    this._$showFloatingWarning.set(false);
    const relational = this._$confirmedRelational();
    if (relational) {
      this._submitRelationalResolution(relational);
      this._$confirmedRelational.set(null);
    }
  }

  protected cancelResolution(): void {
    this._$showFloatingWarning.set(false);
    this._$confirmedRelational.set(null);
  }

  private _loadDetail(): void {
    this._conflictsService
      .getEntityDetail(this.$group().tableName, this.$group().entityId)
      .subscribe({
        next: (detail) => {
          this._$detail.set(detail);
          this._fetchOpenConflictIds(detail);
        },
      });
  }

  private _collectRelationalIds(detail: ConflictEntityDetail): Set<string> {
    const ids = new Set<string>();
    detail.columns.forEach((col) => {
      if (col.relationalConflict) {
        col.relationalConflict.options.forEach((opt) => {
          ids.add(opt.id);
          Object.values(opt.childData).forEach((childId) => { if (childId) { ids.add(childId); } });
        });
      }
      if (col.columnName.endsWith('Id') && col.currentValue) { ids.add(col.currentValue); }
    });
    detail.twoFathersConflict?.options.forEach((opt) => { ids.add(opt.id); });
    return ids;
  }

  private _fetchOpenConflictIds(detail: ConflictEntityDetail): void {
    const ids = this._collectRelationalIds(detail);
    if (ids.size === 0) { return; }
    this._conflictsService.checkOpenIds([...ids]).subscribe({
      next: (openIds) => this._$openConflictIds.set(new Set(openIds)),
    });
  }

  private _submitValueResolution(resolution: PendingValueResolution): void {
    const { tableName, entityId } = this.$group();
    this._conflictsService
      .resolveConflict({ tableName, entityId, columnName: resolution.columnName, winnerValue: resolution.winnerValue, conflictResolver: DEFAULT_USER_NAME, resolutionNotes: this._$notes() })
      .subscribe({ next: () => this._afterResolve() });
  }

  private _submitRelationalResolution(resolution: PendingRelationalResolution): void {
    const subtreeEntries = [...resolution.subtreeLevels.entries()];
    this._conflictsService
      .resolveRelationalConflict({
        conflictIds: resolution.conflictIds,
        winnerRelatedId: resolution.winnerRelatedId,
        winnerChildFkField: subtreeEntries[0]?.[0] ?? null,
        winnerChildId: subtreeEntries[0]?.[1] || null,
        conflictResolver: DEFAULT_USER_NAME,
        resolutionNotes: this._$notes(),
      })
      .subscribe({ next: () => this._afterResolve() });
  }

  private _afterResolve(): void {
    this._$pendingResolution.set(null);
    this._$notes.set('');
    this._$detail.set(null);
    this._homeStore.refresh();
    this._reloadDetailAfterResolve();
  }

  private _reloadDetailAfterResolve(): void {
    const { tableName, entityId } = this.$group();
    this._conflictsService.getEntityDetail(tableName, entityId).subscribe({
      next: (detail) => {
        this._$detail.set(detail);
        const hasConflicts = detail.columns.some((col) => col.isConflicted || col.relationalConflict) || !!detail.twoFathersConflict;
        if (!hasConflicts) {
          this._conflictsStore.removeConflict(tableName, entityId);
        } else {
          this._fetchOpenConflictIds(detail);
        }
      },
    });
  }
}
