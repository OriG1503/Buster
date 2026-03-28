import { Component, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-floating-warning-dialog',
  templateUrl: './floating-warning-dialog.component.html',
  styleUrl: './floating-warning-dialog.component.scss',
})
export class FloatingWarningDialogComponent {
  public readonly $message = input.required<string>();
  public readonly $confirmLabel = input<string>('המשך');
  public readonly $cancelLabel = input<string>('ביטול');

  public readonly confirmed = output<void>();
  public readonly cancelled = output<void>();
}
