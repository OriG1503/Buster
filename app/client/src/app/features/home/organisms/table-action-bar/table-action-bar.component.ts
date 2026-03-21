import { Component, ElementRef, ViewChild, ViewEncapsulation, computed, inject, input, output, signal } from '@angular/core';

import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

import { ENTITY_OPTIONS } from '../../../../shared/consts/entity-options.consts';
import { FK_TO_ENTITY_ID } from '../../../../shared/consts/fk-to-entity-id.consts';
import { ENTITY_COLUMN_LABEL_MAP } from '../../../../shared/mapping/entity-column.label-map';
import { HOME_LABEL_MAP } from '../../mapping/home.label-map';
import { ColumnGroup } from '../../../../shared/types/column-group.type';
import { ColumnToggleEvent } from '../../../../shared/types/column-toggle-event.type';
import { PermissionsService } from '../../../../core/services/permissions/permissions.service';

@Component({
  selector: 'app-table-action-bar',
  imports: [OverlayPanelModule],
  templateUrl: './table-action-bar.component.html',
  styleUrl: './table-action-bar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TableActionBarComponent {
  @ViewChild('entityPanel') private readonly _entityPanel!: OverlayPanel;
  @ViewChild('columnPanel') private readonly _columnPanel!: OverlayPanel;
  @ViewChild('entityPanelContent') private readonly _entityPanelContent!: ElementRef<HTMLElement>;

  public readonly $resultCount = input<number>(0);
  public readonly $columnGroups = input<ColumnGroup[]>([]);
  public readonly $selectedTable = input<string>('robots');
  public readonly $selectedColumns = input<string[]>([]);
  public readonly $hasActiveFilters = input<boolean>(false);

  public readonly entitySelected = output<string>();
  public readonly columnToggle = output<ColumnToggleEvent>();
  public readonly columnReorder = output<string[]>();
  public readonly $isExportMode = input<boolean>(false);
  public readonly $selectedExportCount = input<number>(0);

  public readonly exportExcel = output<void>();
  public readonly exportConfirm = output<void>();
  public readonly exportCancel = output<void>();
  public readonly clearFilters = output<void>();
  public readonly uploadClick = output<void>();

  private readonly _permissionsService = inject(PermissionsService);

  protected readonly _labelMap = HOME_LABEL_MAP;
  protected readonly _columnLabelMap = ENTITY_COLUMN_LABEL_MAP;
  protected readonly ENTITY_OPTIONS = ENTITY_OPTIONS;
  protected readonly _$searchQuery = signal('');
  protected readonly _$canUpload = computed(() => this._permissionsService.canUpload());

  protected readonly _$selectedTableLabel = computed(
    () => ENTITY_OPTIONS.find((opt) => opt.tableName === this.$selectedTable())?.label ?? this.$selectedTable(),
  );

  /** All available columns across all groups, deduplicated by key and by resolved label. */
  protected readonly _$allAvailableColumns = computed(() => {
    const seenKeys = new Set<string>();
    const seenLabels = new Set<string>();
    return this.$columnGroups()
      .flatMap((group) => group.columns)
      .filter((col) => {
        const label = (this._columnLabelMap[col.key] ?? col.label).trim();
        if (seenKeys.has(col.key) || seenLabels.has(label)) {
          return false;
        }
        seenKeys.add(col.key);
        seenLabels.add(label);
        return true;
      });
  });

  /** Ordered list: selected columns first (in their current order), then unselected. Filtered by search. */
  protected readonly _$orderedColumns = computed(() => {
    const allCols = this._$allAvailableColumns();
    const selected = this.$selectedColumns();
    const query = this._$searchQuery().trim().toLowerCase();

    const availableByKey = new Map(allCols.map((c) => [c.key, c]));
    const selectedSet = new Set(selected);

    const selectedCols = selected.map((key) => availableByKey.get(key)).filter((c): c is { key: string; label: string } => !!c);
    const unselectedCols = allCols.filter((c) => !selectedSet.has(c.key));
    const ordered = [...selectedCols, ...unselectedCols];

    if (!query) {
      return ordered;
    }
    return ordered.filter((c) => (this._columnLabelMap[c.key] ?? c.label).toLowerCase().includes(query));
  });

  protected readonly _$selectedVisibleCount = computed(
    () => this._$allAvailableColumns().filter((c) => this.$selectedColumns().includes(c.key)).length,
  );

  private _entityPanelTarget: HTMLElement | null = null;
  private _columnPanelTarget: HTMLElement | null = null;

  protected _draggedKey: string | null = null;
  protected _dragOverKey: string | null = null;

  public onTableSelectClick(event: MouseEvent): void {
    this._entityPanelTarget = event.currentTarget as HTMLElement;
    this._entityPanel.toggle(event);
  }

  public onColumnManageClick(event: MouseEvent): void {
    this._columnPanelTarget = event.currentTarget as HTMLElement;
    this._columnPanel.toggle(event);
  }

  public onEntityPanelShow(): void {
    requestAnimationFrame(() => {
      this._centerPanelBeneathTarget(this._entityPanel, this._entityPanelTarget);
      const content = this._entityPanelContent.nativeElement;
      const active = content.querySelector<HTMLButtonElement>('.entity-panel__item--active');
      const first = content.querySelector<HTMLButtonElement>('button');
      (active ?? first)?.focus();
    });
  }

  public onColumnPanelShow(): void {
    requestAnimationFrame(() => {
      this._centerPanelBeneathTarget(this._columnPanel, this._columnPanelTarget);
    });
  }

  public onEntityPanelKeydown(event: KeyboardEvent): void {
    const buttons = Array.from(this._entityPanelContent.nativeElement.querySelectorAll<HTMLButtonElement>('button'));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      buttons[(index + 1) % buttons.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      (document.activeElement as HTMLButtonElement)?.click();
    }
  }

  public onEntitySelected(tableName: string): void {
    this.entitySelected.emit(tableName);
    this._entityPanel.hide();
  }

  public onColumnToggle(key: string, checked: boolean): void {
    this.columnToggle.emit({ key, checked });
  }

  public onSearchInput(event: Event): void {
    this._$searchQuery.set((event.target as HTMLInputElement).value);
  }

  public onDragStart(key: string): void {
    this._draggedKey = key;
  }

  public onDragOver(event: DragEvent, key: string): void {
    event.preventDefault();
    this._dragOverKey = key;
  }

  public onDrop(event: DragEvent, dropKey: string): void {
    event.preventDefault();
    const dragKey = this._draggedKey;

    if (!dragKey || dragKey === dropKey) {
      this._draggedKey = null;
      this._dragOverKey = null;
      return;
    }

    const selected = this.$selectedColumns();
    if (!selected.includes(dragKey) || !selected.includes(dropKey)) {
      this._draggedKey = null;
      this._dragOverKey = null;
      return;
    }

    const newSelected = [...selected];
    const dragIdx = newSelected.indexOf(dragKey);
    const dropIdx = newSelected.indexOf(dropKey);
    newSelected.splice(dragIdx, 1);
    newSelected.splice(dropIdx, 0, dragKey);

    this.columnReorder.emit(newSelected);
    this._draggedKey = null;
    this._dragOverKey = null;
  }

  public onDragEnd(): void {
    this._draggedKey = null;
    this._dragOverKey = null;
  }

  public onColumnPanelClose(): void {
    this._columnPanel.hide();
    this._$searchQuery.set('');
  }

  private _centerPanelBeneathTarget(panel: OverlayPanel, target: HTMLElement | null): void {
    if (!target) {
      return;
    }
    const containerEl = (panel as any).container as HTMLElement | undefined;
    if (!containerEl) {
      return;
    }
    const btnRect = target.getBoundingClientRect();
    const panelWidth = containerEl.offsetWidth;
    const left = btnRect.left + btnRect.width / 2 - panelWidth / 2;
    containerEl.style.left = `${Math.max(8, left)}px`;
  }
}
