import { Component, computed, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-table-column-header',
  templateUrl: './table-column-header.component.html',
  styleUrl: './table-column-header.component.scss',
})
export class TableColumnHeaderComponent {
  public readonly $label = input.required<string>();
  public readonly $filterValue = input<string>('');

  public readonly filterChange = output<string>();

  protected readonly _$hasValue = computed(() => !!this.$filterValue());
}
