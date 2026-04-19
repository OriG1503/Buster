import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ConflictHistoryPopupComponent } from '../../../conflict-history/organisms/conflict-history-popup/conflict-history-popup.component';
import { CellInfoPopupComponent } from '../cell-info-popup/cell-info-popup.component';
import { TableColumnHeaderComponent } from '../../molecules/table-column-header/table-column-header.component';
import { TableDataCellComponent } from '../../molecules/table-data-cell/table-data-cell.component';
import { HomeStore } from '../../../../core/store/home.store';
import { DisplayNamesService } from '../../../../core/services/display-names/display-names.service';
import { FK_TO_ENTITY_ID } from '../../../../shared/consts/fk-to-entity-id.consts';
import { TableCell } from '../../../../shared/types/table-cell.type';
import { TableRow } from '../../../../shared/types/table-view-response.type';
import { HistoryTarget } from '../../../../shared/types/history-target.type';
import { CellInfoTarget } from '../../types/cell-info-target.type';

@Component({
  selector: 'app-home-table',
  imports: [ConflictHistoryPopupComponent, CellInfoPopupComponent, TableColumnHeaderComponent, TableDataCellComponent],
  templateUrl: './home-table.component.html',
  styleUrl: './home-table.component.scss',
})
export class HomeTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') private readonly _scrollContainerRef!: ElementRef<HTMLElement>;

  protected readonly _store = inject(HomeStore);
  private readonly _router = inject(Router);
  protected readonly _$historyTarget = signal<HistoryTarget | null>(null);
  protected readonly _$cellInfoTarget = signal<CellInfoTarget | null>(null);

  public readonly $isExportMode = input<boolean>(false);
  public readonly $selectedExportIndices = input<Set<number>>(new Set());
  public readonly rowExportToggled = output<number>();

  protected readonly _$displayColumns = computed(() => {
    const cols = this._store.selectedColumns();
    const rootTable = this._store.selectedTable();
    return cols.filter((col) => {
      if (!col.endsWith('.id')) {
        return true;
      }
      if (col === `${rootTable}.id`) {
        return true; // always show the root entity's own ID
      }
      const fkKey = FK_TO_ENTITY_ID[col];
      return !(fkKey && cols.includes(fkKey));
    });
  });

  protected readonly _displayNames = inject(DisplayNamesService);

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
      const [colTable] = col.split('.');
      const tableName = cell.anchorTable ?? colTable;
      const entityId = cell.anchorId ?? row[`${colTable}.id`]?.value ?? '';
      this._router.navigate(['/conflicts'], { queryParams: { tableName, open: entityId } });
      return;
    }
    if (cell.status === 'resolved') {
      if (FK_TO_ENTITY_ID[col] && cell.value !== null && this._getFkTargetTable(col) !== this._store.selectedTable()) {
        window.open(this._buildFkHomeUrl(col, cell.value ?? ''), '_blank');
      } else {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        if (cell.anchorTable && cell.anchorId) {
          this._$historyTarget.set({
            isRelational: true,
            anchorTable: cell.anchorTable,
            anchorId: cell.anchorId,
            relatedTable: cell.relatedTable ?? '',
            anchorTop: rect.top,
            anchorBottom: rect.bottom,
            anchorCenterX: rect.left + rect.width / 2,
          });
        } else {
          const [tableName, columnName] = col.split('.');
          const entityId = row[`${tableName}.id`]?.value ?? '';
          const base = { tableName, entityId, columnName, anchorTop: rect.top, anchorBottom: rect.bottom, anchorCenterX: rect.left + rect.width / 2 };
          if (cell.isCrossEntity) {
            this._$historyTarget.set({ isRelational: false, isCrossEntity: true, ...base });
          } else {
            this._$historyTarget.set({ isRelational: false, ...base });
          }
        }
      }
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
      sourceTime: cell.sourceTime,
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

  public onRowCheckboxChange(index: number): void {
    this.rowExportToggled.emit(index);
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public cellValue(cell: TableCell | undefined): string {
    if (cell?.value === null && cell.status !== 'raw') {
      return 'null';
    }
    return cell?.value ?? '';
  }

  public cellStatus(cell: TableCell | undefined): string {
    return cell?.status ?? 'raw';
  }

  private _getFkTargetTable(col: string): string {
    const fkTarget = FK_TO_ENTITY_ID[col];
    const idCol = fkTarget.endsWith('.id') ? fkTarget : col;
    return idCol.split('.')[0];
  }

  private _buildFkHomeUrl(col: string, entityId: string): string {
    const fkTarget = FK_TO_ENTITY_ID[col];
    // Use the '.id' side of the FK pair as the filter column.
    // e.g. col='robots.wiringId' → fkTarget='wirings.id' → idCol='wirings.id'
    //      col='wirings.id'      → fkTarget='robots.wiringId' → idCol='wirings.id' (col itself)
    const idCol = fkTarget.endsWith('.id') ? fkTarget : col;
    const [targetTable] = idCol.split('.');
    return this._router.serializeUrl(
      this._router.createUrlTree(['/'], { queryParams: { table: targetTable, [`f_${idCol}`]: entityId } }),
    );
  }

  public getCellHref(row: TableRow, col: string): string | null {
    const cell = row[col];
    if (!cell) {
      return null;
    }
    const [colTable] = col.split('.');
    if (cell.status === 'open' && cell.conflictId !== null) {
      const tableName = cell.anchorTable ?? colTable;
      const entityId = cell.anchorId ?? row[`${colTable}.id`]?.value ?? '';
      return this._router.serializeUrl(
        this._router.createUrlTree(['/conflicts'], { queryParams: { tableName, open: entityId } }),
      );
    }
    if (cell.status === 'resolved' && FK_TO_ENTITY_ID[col] && cell.value !== null && this._getFkTargetTable(col) !== this._store.selectedTable()) {
      return this._buildFkHomeUrl(col, cell.value ?? '');
    }
    return null;
  }
}
