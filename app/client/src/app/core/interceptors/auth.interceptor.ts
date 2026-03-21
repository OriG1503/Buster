import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { APP_ROUTES } from '../../shared/consts/app-routes.consts';
import { AuthService } from '../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/api/auth/me')) {
    return next(req);
  }

  const token = authService.getToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        authService.logout();
        return authService.fetchMe().pipe(
          switchMap(() => {
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${authService.getToken()}` } });
            return next(retryReq);
          }),
          catchError(() => {
            void router.navigate([APP_ROUTES.unauthorized]);
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
