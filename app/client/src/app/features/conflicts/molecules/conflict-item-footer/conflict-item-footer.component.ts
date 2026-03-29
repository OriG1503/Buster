import { Component, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-conflict-item-footer',
  templateUrl: './conflict-item-footer.component.html',
  styleUrl: './conflict-item-footer.component.scss',
})
export class ConflictItemFooterComponent {
  public readonly $canResolve = input.required<boolean>();
  public readonly $isResolving = input<boolean>(false);
  public readonly $notes = input.required<string>();

  public readonly resolve = output<void>();
  public readonly notesChange = output<string>();
}
