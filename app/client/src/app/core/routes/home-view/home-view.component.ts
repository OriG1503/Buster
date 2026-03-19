import { Component, signal } from '@angular/core';

import { TableActionBarComponent } from '../../../features/home/organisms/table-action-bar/table-action-bar.component';

@Component({
  selector: 'app-home-view',
  imports: [TableActionBarComponent],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.scss',
})
export class HomeViewComponent {
  protected readonly _$resultCount = signal(0);

  public onTableSelect(): void {}

  public onColumnManage(): void {}

  public onExportExcel(): void {}
}
