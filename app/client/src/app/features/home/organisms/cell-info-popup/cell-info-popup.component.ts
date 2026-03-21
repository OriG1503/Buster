import { Component, computed, input, output } from '@angular/core';

import { CellInfoTarget } from '../../types/cell-info-target.type';
import { CELL_INFO_POPUP_GAP, CELL_INFO_POPUP_HEIGHT, CELL_INFO_POPUP_WIDTH, CELL_INFO_SCREEN_MARGIN } from './cell-info-popup.consts';

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
    const { anchorTop, anchorBottom, anchorCenterX, tableHeaderBottom } = this.$target();
    const left = Math.max(CELL_INFO_SCREEN_MARGIN, Math.min(anchorCenterX - CELL_INFO_POPUP_WIDTH / 2, window.innerWidth - CELL_INFO_POPUP_WIDTH - CELL_INFO_SCREEN_MARGIN));
    const spaceAbove = anchorTop - tableHeaderBottom;
    if (spaceAbove < CELL_INFO_POPUP_HEIGHT + CELL_INFO_POPUP_GAP) {
      return { top: `${anchorBottom + CELL_INFO_POPUP_GAP}px`, bottom: 'auto', left: `${left}px` };
    }
    return { top: 'auto', bottom: `${window.innerHeight - anchorTop + CELL_INFO_POPUP_GAP}px`, left: `${left}px` };
  });

  protected _formatDate(iso: string | null): string {
    if (!iso) {
      return 'N/A';
    }
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
