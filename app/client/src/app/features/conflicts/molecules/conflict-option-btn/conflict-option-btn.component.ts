import { Component, computed, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-conflict-option-btn',
  templateUrl: './conflict-option-btn.component.html',
  styleUrl: './conflict-option-btn.component.scss',
})
export class ConflictOptionBtnComponent {
  public readonly $label = input.required<string>();
  public readonly $isSelected = input<boolean>(false);
  public readonly $isDisabled = input<boolean>(false);
  public readonly $isYellow = input<boolean>(false);
  /** 'red' = conflict option style; 'white' = subtree option style */
  public readonly $variant = input<'red' | 'white'>('red');
  /** true = render label as an ID (conflict-item__id); false = render as a value (conflict-item__value) */
  public readonly $isIdStyle = input<boolean>(true);
  public readonly $source = input<string | null>(null);
  /** ISO string of the user-entered source date. Displayed as DD/MM/YYYY (date only). */
  public readonly $sourceTime = input<string | null>(null);
  /** Label for the source group badge — supplied by the parent from entity config. */
  public readonly $sourceLabel = input<string>('');
  /** Pre-formatted date string for the upload/conflict date — shown below the source group. */
  public readonly $date = input<string | null>(null);
  /** Label for the upload-date badge — supplied by the parent from a label-map. */
  public readonly $uploadedLabel = input<string>('');
  public readonly $notes = input<string | null>(null);

  public readonly selected = output<void>();

  /** Source date formatted as DD/MM/YYYY (no time). Null when sourceTime is absent. */
  protected readonly _$formattedSourceTime = computed(() => {
    const st = this.$sourceTime();
    if (!st) { return null; }
    const d = new Date(st);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
}
