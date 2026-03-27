import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APP_ROUTES } from '../../shared/consts/app-routes.consts';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree([APP_ROUTES.login]);
  }

  if (!authService.hasBusterAccess()) {
    return router.createUrlTree([APP_ROUTES.unauthorized]);
  }

  return true;
};
