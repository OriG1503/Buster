import { Component, input, output } from '@angular/core';

import { HOME_LABEL_MAP } from '../../mapping/home.label-map';

@Component({
  selector: 'app-table-action-bar',
  templateUrl: './table-action-bar.component.html',
  styleUrl: './table-action-bar.component.scss',
})
export class TableActionBarComponent {
  public readonly $resultCount = input<number>(0);

  public readonly tableSelect = output<void>();
  public readonly columnManage = output<void>();
  public readonly exportExcel = output<void>();

  protected readonly _labelMap = HOME_LABEL_MAP;
}
