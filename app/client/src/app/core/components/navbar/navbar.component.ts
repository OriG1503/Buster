import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { NAVBAR_LABEL_MAP } from './mapping/navbar.label-map';
import { APP_ROUTES } from '../../../shared/consts/app-routes.consts';
import { HomeStore } from '../../store/home.store';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly _labelMap = NAVBAR_LABEL_MAP;

  private readonly _router = inject(Router);
  private readonly _homeStore = inject(HomeStore);

  public onHomeClick(): void {
    this._homeStore.selectTable('robots');
    this._router.navigate([APP_ROUTES.home]);
  }

  public onConflictsClick(): void {
    this._router.navigate([APP_ROUTES.conflicts]);
  }
}
