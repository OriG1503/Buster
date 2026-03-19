import { Component, ElementRef, ViewChild, ViewEncapsulation, input, output } from '@angular/core';

import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

import { ENTITY_OPTIONS } from '../../consts/entity-options.consts';
import { HOME_LABEL_MAP } from '../../mapping/home.label-map';
import { ColumnGroup } from '../../types/column-group.type';
import { ColumnToggleEvent } from '../../types/column-toggle-event.type';

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
  @ViewChild('columnPanelContent') private readonly _columnPanelContent!: ElementRef<HTMLElement>;

  public readonly $resultCount = input<number>(0);
  public readonly $columnGroups = input<ColumnGroup[]>([]);
  public readonly $selectedTable = input<string>('robots');
  public readonly $selectedColumns = input<string[]>([]);

  public readonly entitySelected = output<string>();
  public readonly columnToggle = output<ColumnToggleEvent>();
  public readonly exportExcel = output<void>();

  protected readonly _labelMap = HOME_LABEL_MAP;
  protected readonly ENTITY_OPTIONS = ENTITY_OPTIONS;

  private _entityPanelTarget: HTMLElement | null = null;
  private _columnPanelTarget: HTMLElement | null = null;

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
    this.entitySelected.emit(tableName);
    this._entityPanel.hide();
  }

  public onColumnToggle(key: string, checked: boolean): void {
    this.columnToggle.emit({ key, checked });
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
