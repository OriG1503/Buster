import { Routes } from '@angular/router';

import { ConflictsLayoutComponent } from './core/layouts/conflicts-layout/conflicts-layout.component';
import { HomeLayoutComponent } from './core/layouts/home-layout/home-layout.component';
import { UnauthorizedComponent } from './features/unauthorized/unauthorized.component';
import { LoginComponent } from './core/components/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { APP_ROUTES } from './shared/consts/app-routes.consts';

export const routes: Routes = [
  { path: APP_ROUTES.loginSegment, component: LoginComponent },
  { path: APP_ROUTES.unauthorizedSegment, component: UnauthorizedComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeLayoutComponent },
      { path: 'conflicts', component: ConflictsLayoutComponent },
      { path: '**', redirectTo: '' },
    ],
  },
];
