import { animate, style, transition, trigger } from '@angular/animations';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { ConflictGroup } from '../../../../shared/types/conflict-group.type';
import { ConflictEntityDetail, ConflictColumnDetail } from '../../../../shared/types/conflict-entity-detail.type';
import { ConflictsService } from '../../../../core/services/conflicts/conflicts.service';
import { ConflictsStore } from '../../../../core/store/conflicts.store';
import { ENTITY_COLUMN_LABEL_MAP } from '../../../../shared/mapping/entity-column.label-map';
import { PermissionsService } from '../../../../core/services/permissions/permissions.service';

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
  private readonly _permissionsService = inject(PermissionsService);

  protected readonly _isExpanded = signal(false);
  protected readonly _$detail = signal<ConflictEntityDetail | null>(null);
  protected readonly _$notes = signal('');
  protected readonly _$selectedWinners = signal<Map<string, string>>(new Map());

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

  protected readonly _$canResolve = computed(() => this._$selectedWinners().size > 0);
  protected readonly _$canEdit = computed(() => this._permissionsService.canEdit());

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

  public resolve(): void {
    if (!this._$canResolve()) {
      return;
    }
    const { tableName, entityId } = this.$group();
    const notes = this._$notes();
    const winners = this._$selectedWinners();
    const calls = this._$columns()
      .filter((c) => c.isConflicted && winners.has(c.columnName))
      .map((c) =>
        this._conflictsService.resolveConflict({
          tableName,
          entityId,
          columnName: c.columnName,
          winnerValue: winners.get(c.columnName)!,
          conflictResolver: '',
          resolutionNotes: notes,
        }),
      );
    forkJoin(calls).subscribe({
      next: () => {
        this._$selectedWinners.set(new Map());
        this._$detail.set(null);
        const { tableName, entityId } = this.$group();
        this._conflictsService
          .getEntityDetail(tableName, entityId)
          .subscribe({
            next: (detail) => {
              this._$detail.set(detail);
              if (!detail.some((col) => col.isConflicted)) {
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

  protected formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}
