import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NAVBAR_LABEL_MAP } from './mapping/navbar.label-map';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly _labelMap = NAVBAR_LABEL_MAP;

  public onUploadClick(): void {
    // TODO: open upload dialog via UploadDialogService
  }
}
