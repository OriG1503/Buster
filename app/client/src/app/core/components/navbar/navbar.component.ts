import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { NAVBAR_LABEL_MAP } from './mapping/navbar.label-map';
import { APP_ROUTES } from '../../../shared/consts/app-routes.consts';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly _labelMap = NAVBAR_LABEL_MAP;

  private readonly _router = inject(Router);
  private readonly _authService = inject(AuthService);

  protected readonly _$role = computed(() => this._authService.getPayload()?.role ?? '');

  public onHomeClick(): void {
    this._router.navigate([APP_ROUTES.home]);
  }

  public onConflictsClick(): void {
    this._router.navigate([APP_ROUTES.conflicts]);
  }
}
