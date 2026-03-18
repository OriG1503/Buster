import { Routes } from '@angular/router';

import { HomeViewComponent } from './core/routes/home-view/home-view.component';
import { ConflictsViewComponent } from './core/routes/conflicts-view/conflicts-view.component';

export const routes: Routes = [
  { path: '', component: HomeViewComponent },
  { path: 'conflicts', component: ConflictsViewComponent },
  { path: '**', redirectTo: '' },
];
