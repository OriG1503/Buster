import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ConflictHistoryPopupComponent } from '../../../conflict-history/organisms/conflict-history-popup/conflict-history-popup.component';
import { CellInfoPopupComponent } from '../cell-info-popup/cell-info-popup.component';
import { HomeStore } from '../../../../core/store/home.store';
import { FK_TO_ENTITY_ID } from '../../../../shared/consts/fk-to-entity-id.consts';
import { ENTITY_COLUMN_LABEL_MAP } from '../../../../shared/mapping/entity-column.label-map';
import { TableCell } from '../../../../shared/types/table-cell.type';
import { TableRow } from '../../../../shared/types/table-view-response.type';
import { HistoryTarget } from '../../../../shared/types/history-target.type';
import { CellInfoTarget } from '../../types/cell-info-target.type';

@Component({
  selector: 'app-home-table',
  imports: [ConflictHistoryPopupComponent, CellInfoPopupComponent],
  templateUrl: './home-table.component.html',
  styleUrl: './home-table.component.scss',
})
export class HomeTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') private readonly _scrollContainerRef!: ElementRef<HTMLElement>;

  protected readonly _store = inject(HomeStore);
  private readonly _router = inject(Router);
  protected readonly _$historyTarget = signal<HistoryTarget | null>(null);
  protected readonly _$cellInfoTarget = signal<CellInfoTarget | null>(null);

  protected readonly _$displayColumns = computed(() => {
    const cols = this._store.selectedColumns();
    return cols.filter((col) => {
      if (!col.endsWith('.id')) {
        return true;
      }
      const fkKey = FK_TO_ENTITY_ID[col];
      return !(fkKey && cols.includes(fkKey));
    });
  });

  protected readonly _columnLabelMap = ENTITY_COLUMN_LABEL_MAP;

  constructor() {
    effect(() => {
      const isLoading = this._store.isLoading();
      const isLoadingMore = this._store.isLoadingMore();
      if (!isLoading && !isLoadingMore) {
        requestAnimationFrame(() => this._checkScrollForMore());
      }
    });
  }

  public ngAfterViewInit(): void {
    this._scrollContainerRef.nativeElement.addEventListener('scroll', this._onScroll);
  }

  public ngOnDestroy(): void {
    this._scrollContainerRef?.nativeElement.removeEventListener('scroll', this._onScroll);
  }

  private readonly _onScroll = (): void => {
    this._checkScrollForMore();
  };

  private _checkScrollForMore(): void {
    const container = this._scrollContainerRef?.nativeElement;
    if (!container || !this._store.hasMore() || this._store.isLoading() || this._store.isLoadingMore()) {
      return;
    }
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 200) {
      this._store.loadMore();
    }
  }

  public onFilterChange(col: string, value: string): void {
    this._store.setFilter(col, value);
  }

  public onCellClick(row: TableRow, col: string, event: MouseEvent): void {
    const cell = row[col];
    if (!cell) {
      return;
    }
    if (cell.status === 'open' && cell.conflictId !== null) {
      const [tableName] = col.split('.');
      const entityId = row[`${tableName}.id`]?.value ?? '';
      this._router.navigate(['/conflicts'], { queryParams: { tableName, open: entityId } });
      return;
    }
    if (cell.status === 'resolved') {
      const [tableName, columnName] = col.split('.');
      const entityId = row[`${tableName}.id`]?.value ?? '';
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this._$historyTarget.set({
        tableName,
        entityId,
        columnName,
        anchorBottom: rect.bottom,
        anchorCenterX: rect.left + rect.width / 2,
      });
    }
  }

  public onCellMouseEnter(row: TableRow, col: string, event: MouseEvent): void {
    const cell = row[col];
    if (cell?.status !== 'raw' || !cell.value) {
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const thead = this._scrollContainerRef.nativeElement.querySelector('thead');
    const tableHeaderBottom = thead?.getBoundingClientRect().bottom ?? 0;
    this._$cellInfoTarget.set({
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
      anchorCenterX: rect.left + rect.width / 2,
      tableHeaderBottom,
      source: cell.source,
      notes: cell.notes,
      uploadedAt: cell.uploadedAt,
    });
  }

  public onCellMouseLeave(): void {
    this._$cellInfoTarget.set(null);
  }

  public onHistoryPopupClose(): void {
    this._$historyTarget.set(null);
  }

  public onHistoryPopupReverted(): void {
    this._$historyTarget.set(null);
    this._store.refresh();
  }

  public onCellInfoPopupClose(): void {
    this._$cellInfoTarget.set(null);
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public cellValue(cell: TableCell | undefined): string {
    return cell?.value ?? '';
  }

  public cellStatus(cell: TableCell | undefined): string {
    return cell?.status ?? 'raw';
  }

  public getConflictHref(row: TableRow, col: string): string | null {
    const cell = row[col];
    if (!cell || cell.status !== 'open' || cell.conflictId === null) {
      return null;
    }
    const [tableName] = col.split('.');
    const entityId = row[`${tableName}.id`]?.value ?? '';
    return this._router.serializeUrl(
      this._router.createUrlTree(['/conflicts'], { queryParams: { tableName, open: entityId } }),
    );
  }
}
