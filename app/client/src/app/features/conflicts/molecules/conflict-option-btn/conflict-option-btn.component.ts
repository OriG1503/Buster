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
  /** Pre-formatted date string. Combined with source as "date | source". */
  public readonly $date = input<string | null>(null);
  public readonly $notes = input<string | null>(null);

  public readonly selected = output<void>();

  /** Combines date and source into one meta line, omitting nulls. */
  protected readonly _$metaLine = computed(() =>
    [this.$date(), this.$source()].filter(Boolean).join(' | '),
  );
}
