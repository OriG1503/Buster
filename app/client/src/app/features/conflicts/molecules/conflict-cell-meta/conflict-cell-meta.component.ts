import { Component, input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-conflict-cell-meta',
  templateUrl: './conflict-cell-meta.component.html',
  styleUrl: './conflict-cell-meta.component.scss',
  host: { class: 'conflict-cell-meta' },
})
export class ConflictCellMetaComponent {
  /** Whether the parent cell has a current value — gates the source-group and meta display. */
  public readonly $hasValue = input.required<boolean>();
  public readonly $source = input<string | null>(null);
  public readonly $sourceTime = input<string | null>(null);
  public readonly $date = input<string | null>(null);
  public readonly $notes = input<string | null>(null);
  public readonly $sourceLabel = input.required<string>();
  public readonly $uploadedLabel = input.required<string>();
}
