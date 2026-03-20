import { AfterViewInit, Component, computed, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { ConflictsStore } from '../../store/conflicts.store';
import { ConflictItemComponent } from '../../../features/conflicts/organisms/conflict-item/conflict-item.component';
import { ENTITY_OPTIONS } from '../../../shared/consts/entity-options.consts';

@Component({
  selector: 'app-conflicts-layout',
  imports: [ConflictItemComponent],
  templateUrl: './conflicts-layout.component.html',
  styleUrl: './conflicts-layout.component.scss',
})
export class ConflictsLayoutComponent implements AfterViewInit, OnDestroy {
  protected readonly _store = inject(ConflictsStore);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  protected readonly _entityOptions = ENTITY_OPTIONS;

  private readonly _sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');
  private readonly _$isSentinelVisible = signal(false);
  private _observer!: IntersectionObserver;
  private _entityIdDebounce: ReturnType<typeof setTimeout> | null = null;

  private readonly _$queryParams = toSignal(this._route.queryParams, { initialValue: {} as Params });
  protected readonly _$filterTableName = computed(() => this._$queryParams()['tableName'] ?? '');
  protected readonly _$filterEntityId = computed(() => this._$queryParams()['entityId'] ?? '');
  protected readonly _$filterConflictIds = computed<number[]>(() => {
    const raw: string = this._$queryParams()['conflictIds'] ?? '';
    return raw ? raw.split(',').map(Number).filter((n) => !isNaN(n)) : [];
  });

  protected readonly _$filterTitle = computed(() => {
    const parts: string[] = [];
    const conflictIds = this._$filterConflictIds();
    const tableName = this._$filterTableName();
    const entityId = this._$filterEntityId();
    if (conflictIds.length) { parts.push(`קונפליקטים מהעלאה אחרונה (${conflictIds.length})`); }
    if (tableName) {
      const label = this._entityOptions.find((o) => o.tableName === tableName)?.label ?? tableName;
      parts.push(`סוג ישות: ${label}`);
    }
    if (entityId) { parts.push(`מזהה: ${entityId}`); }
    return parts.length ? `מסנן לפי — ${parts.join(' | ')}` : '';
  });

  public constructor() {
    effect(() => {
      this._store.loadConflicts(this._$filterTableName(), this._$filterEntityId(), this._$filterConflictIds());
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
}
