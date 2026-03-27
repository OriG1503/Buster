import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { NavbarComponent } from './core/components/navbar/navbar.component';
import { ToastComponent } from './shared/atoms/toast/toast.component';
import { DisplayNamesService } from './core/services/display-names/display-names.service';
import { APP_ROUTES } from './shared/consts/app-routes.consts';

const ROUTES_WITHOUT_NAVBAR = new Set<string>([APP_ROUTES.unauthorized, APP_ROUTES.login]);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly _router = inject(Router);

  protected readonly _$showNavbar = toSignal(
    this._router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => !ROUTES_WITHOUT_NAVBAR.has(e.urlAfterRedirects.split('?')[0])),
    ),
    { initialValue: !ROUTES_WITHOUT_NAVBAR.has(this._router.url.split('?')[0]) },
  );

  public constructor() {
    inject(DisplayNamesService).load();
  }
}
