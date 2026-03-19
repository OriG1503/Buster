import { Routes } from '@angular/router';

import { ConflictsLayoutComponent } from './core/layouts/conflicts-layout/conflicts-layout.component';
import { HomeLayoutComponent } from './core/layouts/home-layout/home-layout.component';

export const routes: Routes = [
  { path: '', component: HomeLayoutComponent },
  { path: 'conflicts', component: ConflictsLayoutComponent },
  { path: '**', redirectTo: '' },
];
