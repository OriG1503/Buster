import { Component, input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-table-data-cell',
  templateUrl: './table-data-cell.component.html',
  styleUrl: './table-data-cell.component.scss',
})
export class TableDataCellComponent {
  public readonly $value = input.required<string>();
  /** Non-null href means render an anchor tag (open conflict link). */
  public readonly $href = input<string | null>(null);
}
