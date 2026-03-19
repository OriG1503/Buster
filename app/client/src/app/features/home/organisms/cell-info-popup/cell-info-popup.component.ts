import { Component, computed, input, output } from '@angular/core';

import { CellInfoTarget } from '../../types/cell-info-target.type';

const POPUP_WIDTH = 240;
const POPUP_GAP = 8;

@Component({
  selector: 'app-cell-info-popup',
  imports: [],
  templateUrl: './cell-info-popup.component.html',
  styleUrl: './cell-info-popup.component.scss',
})
export class CellInfoPopupComponent {
  public readonly $target = input.required<CellInfoTarget>();
  public readonly closed = output<void>();

  protected readonly _$panelStyle = computed(() => {
    const { anchorBottom, anchorCenterX } = this.$target();
    const top = anchorBottom + POPUP_GAP;
    const left = Math.max(8, Math.min(anchorCenterX - POPUP_WIDTH / 2, window.innerWidth - POPUP_WIDTH - 8));
    return { top: `${top}px`, left: `${left}px` };
  });

  protected _formatDate(iso: string | null): string {
    if (!iso) {
      return 'N/A';
    }
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
