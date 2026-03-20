import { Component, ElementRef, ViewChild, ViewEncapsulation, computed, input, output } from '@angular/core';

import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

import { ENTITY_OPTIONS } from '../../../../shared/consts/entity-options.consts';
import { FK_TO_ENTITY_ID } from '../../../../shared/consts/fk-to-entity-id.consts';
import { ENTITY_COLUMN_LABEL_MAP } from '../../../../shared/mapping/entity-column.label-map';
import { HOME_LABEL_MAP } from '../../mapping/home.label-map';
import { ColumnGroup } from '../../../../shared/types/column-group.type';
import { ColumnToggleEvent } from '../../../../shared/types/column-toggle-event.type';

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
  @ViewChild('column2Panel') private readonly _column2Panel!: OverlayPanel;
  @ViewChild('entityPanelContent') private readonly _entityPanelContent!: ElementRef<HTMLElement>;
  @ViewChild('columnPanelContent') private readonly _columnPanelContent!: ElementRef<HTMLElement>;

  public readonly $resultCount = input<number>(0);
  public readonly $columnGroups = input<ColumnGroup[]>([]);
  public readonly $selectedTable = input<string>('robots');
  public readonly $selectedColumns = input<string[]>([]);
  public readonly $hasActiveFilters = input<boolean>(false);

  public readonly entitySelected = output<string>();
  public readonly columnToggle = output<ColumnToggleEvent>();
  public readonly columnReorder = output<string[]>();
  public readonly exportExcel = output<void>();
  public readonly clearFilters = output<void>();
  public readonly uploadClick = output<void>();

  protected readonly _labelMap = HOME_LABEL_MAP;
  protected readonly _columnLabelMap = ENTITY_COLUMN_LABEL_MAP;
  protected readonly ENTITY_OPTIONS = ENTITY_OPTIONS;

  protected readonly _$selectedTableLabel = computed(
    () => ENTITY_OPTIONS.find((opt) => opt.tableName === this.$selectedTable())?.label ?? this.$selectedTable(),
  );

  /** Visible flat columns — hidden id cols (whose FK counterpart is also selected) are excluded. */
  protected readonly _$flatColumns = computed(() => {
    const cols = this.$selectedColumns();
    return cols.filter((col) => {
      if (!col.endsWith('.id')) {
        return true;
      }
      const fkKey = FK_TO_ENTITY_ID[col];
      return !(fkKey && cols.includes(fkKey));
    });
  });

  private _entityPanelTarget: HTMLElement | null = null;
  private _columnPanelTarget: HTMLElement | null = null;
  private _column2PanelTarget: HTMLElement | null = null;

  protected _draggedIndex: number | null = null;
  protected _dragOverIndex: number | null = null;

  public onTableSelectClick(event: MouseEvent): void {
    this._entityPanelTarget = event.currentTarget as HTMLElement;
    this._entityPanel.toggle(event);
  }

  public onColumnManageClick(event: MouseEvent): void {
    this._columnPanelTarget = event.currentTarget as HTMLElement;
    this._columnPanel.toggle(event);
  }

  public onColumn2ManageClick(event: MouseEvent): void {
    this._column2PanelTarget = event.currentTarget as HTMLElement;
    this._column2Panel.toggle(event);
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
      const first = this._columnPanelContent.nativeElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
      first?.focus();
    });
  }

  public onColumn2PanelShow(): void {
    requestAnimationFrame(() => {
      this._centerPanelBeneathTarget(this._column2Panel, this._column2PanelTarget);
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

  public onColumnPanelKeydown(event: KeyboardEvent): void {
    const inputs = Array.from(
      this._columnPanelContent.nativeElement.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    const index = inputs.indexOf(document.activeElement as HTMLInputElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      inputs[(index + 1) % inputs.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      inputs[(index - 1 + inputs.length) % inputs.length]?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      (document.activeElement as HTMLInputElement)?.click();
    }
  }

  public onEntitySelected(tableName: string): void {
    this.entitySelected.emit(tableName);
    this._entityPanel.hide();
  }

  public onColumnToggle(key: string, checked: boolean): void {
    this.columnToggle.emit({ key, checked });
  }

  public onDragStart(index: number): void {
    this._draggedIndex = index;
  }

  public onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this._dragOverIndex = index;
  }

  public onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    if (this._draggedIndex === null || this._draggedIndex === dropIndex) {
      this._draggedIndex = null;
      this._dragOverIndex = null;
      return;
    }

    const flatCols = this._$flatColumns();
    const newFlatOrder = [...flatCols];
    const [moved] = newFlatOrder.splice(this._draggedIndex, 1);
    newFlatOrder.splice(dropIndex, 0, moved);

    // Rebuild full selectedColumns: insert hidden id cols right after their linked FK col.
    const allCols = this.$selectedColumns();
    const hiddenCols = allCols.filter((col) => !flatCols.includes(col));
    const newOrder: string[] = [];

    newFlatOrder.forEach((col) => {
      newOrder.push(col);
      hiddenCols.forEach((hiddenId) => {
        if (FK_TO_ENTITY_ID[hiddenId] === col && !newOrder.includes(hiddenId)) {
          newOrder.push(hiddenId);
        }
      });
    });

    hiddenCols.forEach((id) => {
      if (!newOrder.includes(id)) {
        newOrder.push(id);
      }
    });

    this.columnReorder.emit(newOrder);
    this._draggedIndex = null;
    this._dragOverIndex = null;
  }

  public onDragEnd(): void {
    this._draggedIndex = null;
    this._dragOverIndex = null;
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
