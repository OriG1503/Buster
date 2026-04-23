import { AfterViewInit, Component, computed, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { ConflictsStore } from '../../store/conflicts.store';
import { ConflictItemComponent } from '../../../features/conflicts/organisms/conflict-item/conflict-item.component';
import { ConflictColorLegendComponent } from '../../../features/conflicts/atoms/conflict-color-legend/conflict-color-legend.component';
import { DisplayNamesService } from '../../services/display-names/display-names.service';

@Component({
  selector: 'app-conflicts-layout',
  imports: [ConflictItemComponent, ConflictColorLegendComponent],
  templateUrl: './conflicts-layout.component.html',
  styleUrl: './conflicts-layout.component.scss',
})
export class ConflictsLayoutComponent implements AfterViewInit, OnDestroy {
  protected readonly _store = inject(ConflictsStore);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _displayNames = inject(DisplayNamesService);

  protected readonly _$entityOptions = computed(() => this._displayNames.$entityOptions());

  private readonly _sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');
  private readonly _$isSentinelVisible = signal(false);
  private _observer!: IntersectionObserver;
  private _entityIdDebounce: ReturnType<typeof setTimeout> | null = null;

  private readonly _$queryParams = toSignal(this._route.queryParams, { initialValue: {} as Params });
  protected readonly _$filterTableName = computed(() => this._$queryParams()['tableName'] ?? '');
  protected readonly _$filterEntityId = computed(() => this._$queryParams()['entityId'] ?? '');
  protected readonly _$filterConflictIds = computed<number[]>(
    () => {
      const raw: string = this._$queryParams()['conflictIds'] ?? '';
      return raw ? raw.split(',').map(Number).filter((n) => !isNaN(n)) : [];
    },
    { equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]) },
  );
  protected readonly _$filterDate = computed(() => this._$queryParams()['date'] ?? '');
  protected readonly _$openEntityId = computed(() => this._$queryParams()['open'] ?? '');

  protected readonly _$filterTitle = computed(() => {
    const parts: string[] = [];
    const conflictIds = this._$filterConflictIds();
    const tableName = this._$filterTableName();
    const entityId = this._$filterEntityId();
    const date = this._$filterDate();
    if (conflictIds.length) { parts.push(`קונפליקטים מהעלאה אחרונה (${conflictIds.length})`); }
    if (tableName) {
      parts.push(`סוג ישות: ${this._displayNames.getEntityPluralName(tableName)}`);
    }
    if (entityId) { parts.push(`מזהה: ${entityId}`); }
    if (date) { parts.push(`תאריך: ${this._formatHebrewDate(date)}`); }
    return parts.length ? `מסנן לפי — ${parts.join(' | ')}` : '';
  });

  public constructor() {
    effect(() => {
      this._store.loadConflicts(
        this._$filterTableName(),
        this._$filterEntityId(),
        this._$filterConflictIds(),
        this._$filterDate(),
      );
    });
    effect(() => {
      if (this._$isSentinelVisible() && !this._store.isLoadingMore() && this._store.hasMore()) {
        this._store.loadMoreConflicts();
      }
    });
  }

  public ngAfterViewInit(): void {
    this._observer = new IntersectionObserver(
      (entries) => {
        this._$isSentinelVisible.set(entries[0].isIntersecting);
      },
      { rootMargin: '300px' },
    );
    this._observer.observe(this._sentinel().nativeElement);
  }

  public ngOnDestroy(): void {
    this._observer.disconnect();
    if (this._entityIdDebounce) {
      clearTimeout(this._entityIdDebounce);
    }
  }

  protected clearFilters(): void {
    this._router.navigate([], { queryParams: {} });
  }

  protected onTableNameChange(tableName: string): void {
    this._router.navigate([], {
      queryParams: { tableName: tableName || null, entityId: null },
      queryParamsHandling: 'merge',
    });
  }

  protected onConflictToggled(entityId: string | null): void {
    this._router.navigate([], {
      queryParams: { open: entityId || null },
      queryParamsHandling: 'merge',
    });
  }

  protected onEntityIdInput(value: string): void {
    if (this._entityIdDebounce) {
      clearTimeout(this._entityIdDebounce);
    }
    this._entityIdDebounce = setTimeout(() => {
      this._router.navigate([], {
        queryParams: { entityId: value || null },
        queryParamsHandling: 'merge',
      });
    }, 300);
  }

  protected onDateChange(value: string): void {
    this._router.navigate([], {
      queryParams: { date: value || null },
      queryParamsHandling: 'merge',
    });
  }

  private _formatHebrewDate(isoDate: string): string {
    const parsed = new Date(isoDate);
    if (isNaN(parsed.getTime())) {
      return isoDate;
    }
    return parsed.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}
