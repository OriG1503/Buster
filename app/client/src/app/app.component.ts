import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './core/components/navbar/navbar.component';
import { ToastComponent } from './shared/atoms/toast/toast.component';
import { DisplayNamesService } from './core/services/display-names/display-names.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public constructor() {
    inject(DisplayNamesService).load();
  }
}
