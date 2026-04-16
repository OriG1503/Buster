import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { from, of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';

import { ConflictColumnDetail, ConflictEntityDetail, CrossEntityConflictEntry, RelationalConflictDetail, TwoFathersConflictDetail } from '../../../../shared/types/conflict-entity-detail.type';
import { ConflictGroup } from '../../../../shared/types/conflict-group.type';
import { ConflictsService } from '../../../../core/services/conflicts/conflicts.service';
import { ConflictsStore } from '../../../../core/store/conflicts.store';
import { HomeStore } from '../../../../core/store/home.store';
import { DisplayNamesService } from '../../../../core/services/display-names/display-names.service';
import { PermissionsService } from '../../../../core/services/permissions/permissions.service';
import { ENTITY_COLUMN_TREE } from '../../../../shared/consts/entity-column-tree.consts';
import { DEFAULT_USER_NAME } from '../../../../shared/consts/default-user.consts';
import { PendingResolution, PendingRelationalResolution, PendingCrossEntityResolution } from '../../types/pending-resolution.type';
import { ConflictOptionBtnComponent } from '../../molecules/conflict-option-btn/conflict-option-btn.component';
import { FloatingWarningDialogComponent } from '../../molecules/floating-warning-dialog/floating-warning-dialog.component';
import { ConflictItemFooterComponent } from '../../molecules/conflict-item-footer/conflict-item-footer.component';
import { ConflictCellMetaComponent } from '../../molecules/conflict-cell-meta/conflict-cell-meta.component';
import { FADE_SLIDE_IN_ANIMATION, SLIDE_DOWN_ANIMATION } from './conflict-item.consts';
import { CONFLICTS_LABEL_MAP } from '../../mapping/conflicts.label-map';

@Component({
  selector: 'app-conflict-item',
  standalone: true,
  imports: [ConflictOptionBtnComponent, FloatingWarningDialogComponent, ConflictItemFooterComponent, ConflictCellMetaComponent],
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
  protected readonly _$pendingResolutions = signal<Map<string, PendingResolution>>(new Map());
  protected readonly _$failedResolutionKeys = signal<Set<string>>(new Set());
  protected readonly _$openConflictIds = signal<Set<string>>(new Set());
  protected readonly _$showFloatingWarning = signal(false);
  protected readonly _$isResolving = signal(false);

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
    this._$allColumns().filter((col) => !col.isConflicted && !col.relationalConflict && col.crossEntityConflicts.length === 0 && col.columnName !== 'id'),
  );
  protected readonly _$canResolve = computed(() => {
    if (this._$isResolving()) { return false; }
    const resolutions = this._$pendingResolutions();
    if (resolutions.size === 0 || !this._$notes().trim()) { return false; }
    return [...resolutions.values()].every((r) => {
      if (r.type !== 'twoChilds') { return true; }
      return [...(r as PendingRelationalResolution).subtreeLevels.values()].every((v) => !!v);
    });
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
    const key = `value:${columnName}`;
    this._$pendingResolutions.update((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing?.type === 'value' && existing.winnerValue === value) {
        next.delete(key);
      } else {
        next.set(key, { type: 'value', columnName, winnerValue: value });
      }
      return next;
    });
    this._clearFailedKey(`value:${columnName}`);
  }

  protected isValueWinnerSelected(columnName: string, value: string | null): boolean {
    if (!value) { return false; }
    const res = this._$pendingResolutions().get(`value:${columnName}`);
    return res?.type === 'value' && res.winnerValue === value;
  }

  protected isValueResolutionFailed(columnName: string): boolean {
    return this._$failedResolutionKeys().has(`value:${columnName}`);
  }

  // --- TWO_CHILDS ---

  protected selectTwoChildsWinner(columnName: string, rc: RelationalConflictDetail, winnerId: string): void {
    const key = `twoChilds:${columnName}`;
    this._$pendingResolutions.update((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) as PendingRelationalResolution | undefined;
      if (existing?.type === 'twoChilds' && existing.winnerRelatedId === winnerId) {
        next.delete(key);
      } else {
        const subtreeFields = this.getSubtreeFkFields(rc);
        next.set(key, {
          type: 'twoChilds',
          columnName,
          conflictIds: rc.conflictIds,
          winnerRelatedId: winnerId,
          subtreeLevels: new Map(subtreeFields.map((f) => [f, ''] as [string, string])),
        });
      }
      return next;
    });
    this._clearFailedKey(key);
  }

  protected isTwoChildsWinnerSelected(columnName: string, id: string): boolean {
    const res = this._$pendingResolutions().get(`twoChilds:${columnName}`) as PendingRelationalResolution | undefined;
    return res?.type === 'twoChilds' && res.winnerRelatedId === id;
  }

  protected isTwoChildsResolutionFailed(columnName: string): boolean {
    return this._$failedResolutionKeys().has(`twoChilds:${columnName}`);
  }

  protected selectSubtreeLevel(columnName: string, fkField: string, childId: string): void {
    const key = `twoChilds:${columnName}`;
    this._$pendingResolutions.update((prev) => {
      const existing = prev.get(key) as PendingRelationalResolution | undefined;
      if (!existing || existing.type !== 'twoChilds') { return prev; }
      const newLevels = new Map(existing.subtreeLevels);
      newLevels.set(fkField, newLevels.get(fkField) === childId ? '' : childId);
      return new Map(prev).set(key, { ...existing, subtreeLevels: newLevels });
    });
  }

  protected isSubtreeLevelSelected(columnName: string, fkField: string, childId: string): boolean {
    const res = this._$pendingResolutions().get(`twoChilds:${columnName}`) as PendingRelationalResolution | undefined;
    if (!res || res.type !== 'twoChilds') { return false; }
    return res.subtreeLevels.get(fkField) === childId;
  }

  // --- TWO_FATHERS ---

  protected selectTwoFathersWinner(rc: TwoFathersConflictDetail, winnerId: string): void {
    const key = 'twoFathers:__twoFathers__';
    this._$pendingResolutions.update((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) as PendingRelationalResolution | undefined;
      if (existing?.type === 'twoFathers' && existing.winnerRelatedId === winnerId) {
        next.delete(key);
      } else {
        next.set(key, { type: 'twoFathers', columnName: '__twoFathers__', conflictIds: rc.conflictIds, winnerRelatedId: winnerId, subtreeLevels: new Map() });
      }
      return next;
    });
    this._clearFailedKey(key);
  }

  protected isTwoFathersWinnerSelected(id: string): boolean {
    const res = this._$pendingResolutions().get('twoFathers:__twoFathers__') as PendingRelationalResolution | undefined;
    return res?.type === 'twoFathers' && res.winnerRelatedId === id;
  }

  protected isTwoFathersResolutionFailed(): boolean {
    return this._$failedResolutionKeys().has('twoFathers:__twoFathers__');
  }

  // --- Cross-entity conflict ---

  protected selectCrossEntityWinner(columnName: string, entry: CrossEntityConflictEntry, value: string | null, applyToRobot: boolean): void {
    if (!value) { return; }
    const key = `crossEntity:${entry.conflictId}`;
    this._$pendingResolutions.update((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) as PendingCrossEntityResolution | undefined;
      if (existing?.type === 'crossEntity' && existing.winnerValue === value) {
        next.delete(key);
      } else {
        next.set(key, { type: 'crossEntity', columnName, conflictId: entry.conflictId, winnerValue: value, applyToRobot });
      }
      return next;
    });
    this._clearFailedKey(key);
  }

  protected isCrossEntityWinnerSelected(columnName: string, value: string | null): boolean {
    if (!value) { return false; }
    return [...this._$pendingResolutions().values()].some(
      (r) => r.type === 'crossEntity' && r.columnName === columnName && (r as PendingCrossEntityResolution).winnerValue === value,
    );
  }

  protected isCrossEntityResolutionFailed(conflictId: number): boolean {
    return this._$failedResolutionKeys().has(`crossEntity:${conflictId}`);
  }

  protected getCrossEntityBadge(entry: CrossEntityConflictEntry): { entityLabel: string; entityId: string } {
    return { entityLabel: this._displayNames.getEntityName(entry.entityTable), entityId: entry.entityId };
  }

  protected getSelfEntityBadge(): { entityLabel: string; entityId: string } {
    return { entityLabel: this._displayNames.getEntityName(this.$group().tableName), entityId: this.$group().entityId };
  }

  // --- Resolution submit ---

  public resolve(): void {
    if (!this._$canResolve()) { return; }
    const hasRelational = [...this._$pendingResolutions().values()].some((r) => r.type === 'twoFathers' || r.type === 'twoChilds');
    if (hasRelational) {
      this._$showFloatingWarning.set(true);
    } else {
      this._executeBatch();
    }
  }

  protected confirmResolution(): void {
    this._$showFloatingWarning.set(false);
    this._executeBatch();
  }

  protected cancelResolution(): void {
    this._$showFloatingWarning.set(false);
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

  private _executeBatch(): void {
    this._$isResolving.set(true);
    this._$failedResolutionKeys.set(new Set());
    const entries = [...this._$pendingResolutions().entries()];
    const hadCrossEntity = entries.some(([, r]) => r.type === 'crossEntity');
    const results = new Map<string, boolean>();

    from(entries)
      .pipe(
        concatMap(([key, resolution]) =>
          this._buildApiCall(resolution).pipe(
            map(() => ({ key, success: true as const })),
            catchError(() => of({ key, success: false as const })),
          ),
        ),
      )
      .subscribe({
        next: ({ key, success }) => results.set(key, success),
        complete: () => this._afterBatch(results, hadCrossEntity),
      });
  }

  private _buildApiCall(resolution: PendingResolution) {
    const { tableName, entityId } = this.$group();
    const notes = this._$notes();
    if (resolution.type === 'value') {
      return this._conflictsService.resolveConflict({ tableName, entityId, columnName: resolution.columnName, winnerValue: resolution.winnerValue, conflictResolver: DEFAULT_USER_NAME, resolutionNotes: notes });
    }
    if (resolution.type === 'crossEntity') {
      return this._conflictsService.resolveCrossEntityConflict({ conflictId: resolution.conflictId, winnerValue: resolution.winnerValue, conflictResolver: DEFAULT_USER_NAME, resolutionNotes: notes, applyToRobot: resolution.applyToRobot });
    }
    const subtreeEntries = [...resolution.subtreeLevels.entries()];
    return this._conflictsService.resolveRelationalConflict({ conflictIds: resolution.conflictIds, winnerRelatedId: resolution.winnerRelatedId, winnerChildFkField: subtreeEntries[0]?.[0] ?? null, winnerChildId: subtreeEntries[0]?.[1] || null, conflictResolver: DEFAULT_USER_NAME, resolutionNotes: notes });
  }

  private _afterBatch(results: Map<string, boolean>, hadCrossEntity: boolean): void {
    this._$isResolving.set(false);
    const failedKeys = new Set([...results.entries()].filter(([, success]) => !success).map(([key]) => key));

    this._$pendingResolutions.update((prev) => {
      const next = new Map(prev);
      results.forEach((success, key) => { if (success) { next.delete(key); } });
      return next;
    });

    this._$failedResolutionKeys.set(failedKeys);

    if (failedKeys.size === 0) { this._$notes.set(''); }

    this._homeStore.refresh();

    if (hadCrossEntity) {
      const filter = this._conflictsStore.filter();
      this._conflictsStore.loadConflicts(filter.tableName, filter.entityId, filter.conflictIds);
    }

    this._$detail.set(null);
    this._reloadDetailAfterResolve();
  }

  private _clearFailedKey(key: string): void {
    if (this._$failedResolutionKeys().has(key)) {
      this._$failedResolutionKeys.update((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  }

  private _reloadDetailAfterResolve(): void {
    const { tableName, entityId } = this.$group();
    this._conflictsService.getEntityDetail(tableName, entityId).subscribe({
      next: (detail) => {
        this._$detail.set(detail);
        const hasConflicts = detail.columns.some((col) => col.isConflicted || col.relationalConflict || col.crossEntityConflicts.length > 0) || !!detail.twoFathersConflict;
        if (!hasConflicts) {
          this._conflictsStore.removeConflict(tableName, entityId);
        } else {
          this._fetchOpenConflictIds(detail);
        }
      },
    });
  }
}
