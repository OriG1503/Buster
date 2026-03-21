import { animate, style, transition, trigger } from '@angular/animations';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { ConflictGroup } from '../../../../shared/types/conflict-group.type';
import { ConflictEntityDetail, ConflictColumnDetail, RelationalConflictDetail } from '../../../../shared/types/conflict-entity-detail.type';
import { ConflictsService } from '../../../../core/services/conflicts/conflicts.service';
import { ConflictsStore } from '../../../../core/store/conflicts.store';
import { ENTITY_COLUMN_LABEL_MAP } from '../../../../shared/mapping/entity-column.label-map';
import { FK_TO_ENTITY_ID } from '../../../../shared/consts/fk-to-entity-id.consts';
import { DEFAULT_USER_NAME } from '../../../../shared/consts/default-user.consts';

type RelationalWinner = {
  winnerRelatedId: string;
  winnerChildId?: string | null;
  winnerChildFkField?: string | null;
};

type ChildEntry = {
  field: string;
  oldId: string | null;
  newId: string | null;
};

@Component({
  selector: 'app-conflict-item',
  standalone: true,
  templateUrl: './conflict-item.component.html',
  styleUrl: './conflict-item.component.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', overflow: 'hidden', opacity: 0 }),
        animate('220ms ease-out', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ height: '*', overflow: 'hidden', opacity: 1 }),
        animate('180ms ease-in', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      ]),
    ]),
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ConflictItemComponent {
  public readonly $group = input.required<ConflictGroup>();
  public readonly $isOpen = input<boolean>(false);
  public readonly toggled = output<string | null>();

  private readonly _conflictsService = inject(ConflictsService);
  private readonly _conflictsStore = inject(ConflictsStore);

  protected readonly _isExpanded = signal(false);
  protected readonly _$detail = signal<ConflictEntityDetail | null>(null);
  protected readonly _$notes = signal('');
  protected readonly _$selectedWinners = signal<Map<string, string>>(new Map());
  protected readonly _$selectedRelationalWinners = signal<Map<string, RelationalWinner>>(new Map());

  protected readonly _$columns = computed<ConflictColumnDetail[]>(() => {
    const detail = this._$detail();
    if (!detail) {
      return [];
    }
    const detailMap = new Map(detail.map((col) => [col.columnName, col]));
    const prefix = `${this.$group().tableName}.`;
    return Object.keys(ENTITY_COLUMN_LABEL_MAP)
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
      .map((columnName) => detailMap.get(columnName))
      .filter((col): col is ConflictColumnDetail => col !== undefined);
  });

  protected readonly _$canResolve = computed(
    () => this._$selectedWinners().size > 0 || this._$selectedRelationalWinners().size > 0,
  );

  public constructor() {
    effect(() => {
      if (this.$isOpen() && !this._isExpanded()) {
        this._isExpanded.set(true);
        if (!this._$detail()) {
          this._conflictsService
            .getEntityDetail(this.$group().tableName, this.$group().entityId)
            .subscribe({ next: (detail) => this._$detail.set(detail) });
        }
      }
    });
  }

  public toggle(): void {
    this._isExpanded.update((v) => !v);
    if (this._isExpanded()) {
      if (!this._$detail()) {
        this._conflictsService
          .getEntityDetail(this.$group().tableName, this.$group().entityId)
          .subscribe({ next: (detail) => this._$detail.set(detail) });
      }
      this.toggled.emit(this.$group().entityId);
    } else {
      this.toggled.emit(null);
    }
  }

  protected selectWinner(columnName: string, value: string): void {
    this._$selectedWinners.update((map) => {
      const next = new Map(map);
      if (next.get(columnName) === value) {
        next.delete(columnName);
      } else {
        next.set(columnName, value);
      }
      return next;
    });
  }

  protected isWinnerSelected(columnName: string, value: string | null): boolean {
    return this._$selectedWinners().get(columnName) === value;
  }

  protected selectRelationalWinner(columnName: string, winnerRelatedId: string): void {
    this._$selectedRelationalWinners.update((map) => {
      const next = new Map(map);
      const existing = next.get(columnName);
      if (existing?.winnerRelatedId === winnerRelatedId) {
        next.delete(columnName);
      } else {
        next.set(columnName, { winnerRelatedId, winnerChildId: null, winnerChildFkField: null });
      }
      return next;
    });
  }

  protected isRelationalWinnerSelected(columnName: string, relatedId: string): boolean {
    return this._$selectedRelationalWinners().get(columnName)?.winnerRelatedId === relatedId;
  }

  protected getRelationalWinner(columnName: string): RelationalWinner | undefined {
    return this._$selectedRelationalWinners().get(columnName);
  }

  protected selectRelationalChild(columnName: string, field: string, childId: string): void {
    this._$selectedRelationalWinners.update((map) => {
      const next = new Map(map);
      const existing = next.get(columnName);
      if (!existing) { return next; }
      if (existing.winnerChildId === childId && existing.winnerChildFkField === field) {
        next.set(columnName, { ...existing, winnerChildId: null, winnerChildFkField: null });
      } else {
        next.set(columnName, { ...existing, winnerChildId: childId, winnerChildFkField: field });
      }
      return next;
    });
  }

  protected isChildWinnerSelected(columnName: string, field: string, childId: string): boolean {
    const winner = this._$selectedRelationalWinners().get(columnName);
    return winner?.winnerChildFkField === field && winner?.winnerChildId === childId;
  }

  protected getRelatedChildEntries(rc: RelationalConflictDetail): ChildEntry[] {
    if (!rc.snapshot) { return []; }
    const prefix = `${rc.relatedTable}.`;
    return Object.keys(FK_TO_ENTITY_ID)
      .filter((key) => key.startsWith(prefix))
      .map((key) => {
        const field = key.slice(prefix.length);
        const oldId = (rc.snapshot!.oldRelated[field] as string | null | undefined) ?? null;
        const newId = (rc.snapshot!.newRelated[field] as string | null | undefined) ?? null;
        return { field, oldId, newId };
      })
      .filter((entry) => entry.oldId !== entry.newId);
  }

  public resolve(): void {
    if (!this._$canResolve()) {
      return;
    }
    const { tableName, entityId } = this.$group();
    const notes = this._$notes();
    const winners = this._$selectedWinners();
    const relationalWinners = this._$selectedRelationalWinners();

    const valueCalls = this._$columns()
      .filter((c) => c.isConflicted && winners.has(c.columnName))
      .map((c) =>
        this._conflictsService.resolveConflict({
          tableName,
          entityId,
          columnName: c.columnName,
          winnerValue: winners.get(c.columnName)!,
          conflictResolver: DEFAULT_USER_NAME,
          resolutionNotes: notes,
        }),
      );

    const relationalCalls = this._$columns()
      .filter((c) => c.relationalConflict && relationalWinners.has(c.columnName))
      .map((c) => {
        const rc = c.relationalConflict!;
        const winner = relationalWinners.get(c.columnName)!;
        return this._conflictsService.resolveRelationalConflict({
          conflictId: rc.conflictId,
          winnerRelatedId: winner.winnerRelatedId,
          winnerChildId: winner.winnerChildId,
          winnerChildFkField: winner.winnerChildFkField,
          conflictResolver: DEFAULT_USER_NAME,
          resolutionNotes: notes,
        });
      });

    forkJoin([...valueCalls, ...relationalCalls]).subscribe({
      next: () => {
        this._$selectedWinners.set(new Map());
        this._$selectedRelationalWinners.set(new Map());
        this._$detail.set(null);
        this._conflictsService.getEntityDetail(tableName, entityId).subscribe({
          next: (detail) => {
            this._$detail.set(detail);
            if (!detail.some((col) => col.isConflicted || col.relationalConflict)) {
              this._conflictsStore.removeConflict(tableName, entityId);
            }
          },
        });
      },
    });
  }

  protected getLabel(columnName: string): string {
    return ENTITY_COLUMN_LABEL_MAP[`${this.$group().tableName}.${columnName}`] ?? columnName;
  }

  protected getLabelForKey(key: string): string {
    return ENTITY_COLUMN_LABEL_MAP[key] ?? key;
  }

  protected formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}
