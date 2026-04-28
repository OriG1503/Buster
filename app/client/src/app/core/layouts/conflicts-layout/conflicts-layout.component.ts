import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { ConflictsStore } from '../../store/conflicts.store';
import { ConflictItemComponent } from '../../../features/conflicts/organisms/conflict-item/conflict-item.component';
import { ConflictColorLegendComponent } from '../../../features/conflicts/atoms/conflict-color-legend/conflict-color-legend.component';
import { DateRangePickerComponent } from '../../../features/conflicts/molecules/date-range-picker/date-range-picker.component';
import { DisplayNamesService } from '../../services/display-names/display-names.service';

@Component({
  selector: 'app-conflicts-layout',
  imports: [ConflictItemComponent, ConflictColorLegendComponent, DateRangePickerComponent],
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
  protected readonly _$filterStartDate = computed(() => this._$queryParams()['startDate'] ?? '');
  protected readonly _$filterEndDate = computed(() => this._$queryParams()['endDate'] ?? '');
  protected readonly _$filterDateRange = computed<Date[] | null>(
    () => {
      const start = this._$filterStartDate();
      const end = this._$filterEndDate();
      if (!start || !end) {
        return null;
      }
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }
      return [startDate, endDate];
    },
    {
      equal: (a, b) => {
        if (a === b) { return true; }
        if (!a || !b) { return false; }
        return a.length === b.length && a.every((d, i) => d.getTime() === b[i].getTime());
      },
    },
  );
  protected readonly _$openEntityId = computed(() => this._$queryParams()['open'] ?? '');

  protected readonly _$filterTitle = computed(() => {
    const parts: string[] = [];
    const conflictIds = this._$filterConflictIds();
    const tableName = this._$filterTableName();
    const entityId = this._$filterEntityId();
    const start = this._$filterStartDate();
    const end = this._$filterEndDate();
    if (conflictIds.length) { parts.push(`קונפליקטים מהעלאה אחרונה (${conflictIds.length})`); }
    if (tableName) {
      parts.push(`סוג ישות: ${this._displayNames.getEntityPluralName(tableName)}`);
    }
    if (entityId) { parts.push(`מזהה: ${entityId}`); }
    if (start && end) {
      parts.push(`תאריך: ${this._formatHebrewDate(start)} - ${this._formatHebrewDate(end)}`);
    }
    return parts.length ? `מסנן לפי — ${parts.join(' | ')}` : '';
  });

  public constructor() {
    effect(() => {
      this._store.loadConflicts(
        this._$filterTableName(),
        this._$filterEntityId(),
        this._$filterConflictIds(),
        this._$filterStartDate(),
        this._$filterEndDate(),
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

  protected onDateRangeChange(range: Date[] | null): void {
    if (!range || range.length !== 2 || !range[0] || !range[1]) {
      this._router.navigate([], {
        queryParams: { startDate: null, endDate: null },
        queryParamsHandling: 'merge',
      });
      return;
    }
    this._router.navigate([], {
      queryParams: {
        startDate: this._toIsoDate(range[0]),
        endDate: this._toIsoDate(range[1]),
      },
      queryParamsHandling: 'merge',
    });
  }

  private _toIsoDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private _formatHebrewDate(isoDate: string): string {
    const parsed = new Date(isoDate);
    if (isNaN(parsed.getTime())) {
      return isoDate;
    }
    return parsed.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}
