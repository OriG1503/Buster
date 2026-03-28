import { Component, input } from '@angular/core';

@Component({
  selector: 'app-popup-meta-field',
  templateUrl: './popup-meta-field.component.html',
  styleUrl: './popup-meta-field.component.scss',
})
export class PopupMetaFieldComponent {
  public readonly $label = input.required<string>();
  public readonly $value = input.required<string>();
  /** Applies the --notes value modifier for multi-line note text. */
  public readonly $isNotes = input<boolean>(false);
}
