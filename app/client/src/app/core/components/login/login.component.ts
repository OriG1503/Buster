import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { APP_ROUTES } from '../../../shared/consts/app-routes.consts';
import { AuthService } from '../../services/auth/auth.service';

// TODO: Replace with the real SSO URL when available.
// While this is null the login component falls back to fetchMe() (server mock token) for development.
const SSO_URL: string | null = null;

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private readonly _router = inject(Router);
  private readonly _authService = inject(AuthService);

  public ngAfterViewInit(): void {
    if (this._authService.hasBusterAccess()) {
      void this._router.navigate([APP_ROUTES.home]);
      return;
    }

    if (!SSO_URL) {
      // Dev fallback: no SSO URL configured yet — get a token directly from the server mock endpoint.
      this._authService.fetchMe().subscribe({
        next: () => void this._router.navigate([APP_ROUTES.home]),
      });
      return;
    }

    window.open(SSO_URL, '_blank', 'width=500,height=600');

    // The SSO popup will write the token to localStorage when authentication completes.
    // The storage event fires in this window whenever another window on the same origin
    // modifies localStorage — used here to detect when the token has been set.
    window.addEventListener('storage', this._onStorage);
  }

  public ngOnDestroy(): void {
    window.removeEventListener('storage', this._onStorage);
  }

  private readonly _onStorage = (event: StorageEvent): void => {
    if (event.key === 'buster_access_token' && event.newValue) {
      window.removeEventListener('storage', this._onStorage);
      void this._router.navigate([APP_ROUTES.home]);
    }
  };
}
