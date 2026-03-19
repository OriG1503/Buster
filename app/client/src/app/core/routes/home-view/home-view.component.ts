import { Component, ElementRef, ViewChild, ViewEncapsulation, computed, signal } from '@angular/core';

import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

import { ENTITY_COLUMN_TREE } from '../../../features/home/consts/entity-column-tree.consts';
import { ENTITY_OPTIONS } from '../../../features/home/consts/entity-options.consts';
import { FK_TO_ENTITY_ID } from '../../../features/home/consts/fk-to-entity-id.consts';
import { TableActionBarComponent } from '../../../features/home/organisms/table-action-bar/table-action-bar.component';

@Component({
  selector: 'app-home-view',
  imports: [TableActionBarComponent, OverlayPanelModule],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HomeViewComponent {
  @ViewChild('entityPanel') private readonly _entityPanel!: OverlayPanel;
  @ViewChild('columnPanel') private readonly _columnPanel!: OverlayPanel;
  @ViewChild('entityPanelContent') private readonly _entityPanelContent!: ElementRef<HTMLElement>;
  @ViewChild('columnPanelContent') private readonly _columnPanelContent!: ElementRef<HTMLElement>;

  protected readonly _$resultCount = signal(0);
  protected readonly _$selectedTable = signal<string>('robots');
  protected readonly _$selectedColumns = signal<string[]>(this._defaultColumns('robots'));
  protected readonly _$columnGroups = computed(() => ENTITY_COLUMN_TREE[this._$selectedTable()]);

  protected readonly ENTITY_OPTIONS = ENTITY_OPTIONS;
  protected readonly ENTITY_COLUMN_TREE = ENTITY_COLUMN_TREE;

  private _entityPanelTarget: HTMLElement | null = null;
  private _columnPanelTarget: HTMLElement | null = null;

  public onTableSelect(event: MouseEvent): void {
    this._entityPanelTarget = event.currentTarget as HTMLElement;
    this._entityPanel.toggle(event);
  }

  public onColumnManage(event: MouseEvent): void {
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
      const first = this._columnPanelContent.nativeElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
      first?.focus();
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
    this._$selectedTable.set(tableName);
    this._$selectedColumns.set(this._defaultColumns(tableName));
    this._entityPanel.hide();
  }

  public onColumnToggle(key: string, checked: boolean): void {
    const cols = this._$selectedColumns();
    const linkedId = FK_TO_ENTITY_ID[key];

    if (checked) {
      const toAdd = [key, ...(linkedId && !cols.includes(linkedId) ? [linkedId] : [])];
      this._$selectedColumns.set([...cols, ...toAdd]);
    } else {
      const toRemove = new Set([key, ...(linkedId ? [linkedId] : [])]);
      this._$selectedColumns.set(cols.filter((col) => !toRemove.has(col)));
    }
  }

  public onExportExcel(): void {}

  private _defaultColumns(tableName: string): string[] {
    const keys = ENTITY_COLUMN_TREE[tableName][0].columns.map((col) => col.key);
    const linked = keys.map((key) => FK_TO_ENTITY_ID[key]).filter((id): id is string => !!id && !keys.includes(id));
    return [...keys, ...linked];
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
