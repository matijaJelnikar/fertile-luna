import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

enum NavigationButton {
  HOME = 'HOME',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
}

@Component({
  selector: 'lib-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    RouterModule,
    NgClass,
    TranslateModule,
  ],
})
export class ShellComponent {
  selectedTab: NavigationButton = NavigationButton.HOME;

  protected Navigation: typeof NavigationButton = NavigationButton;

  constructor(private router: Router) {}

  selectTab(navButton: NavigationButton): void {
    this.selectedTab = navButton;
    switch (navButton) {
      case NavigationButton.HOME:
        this.router.navigate(['/home']);
        break;
      case NavigationButton.HISTORY:
        this.router.navigate(['/history']);
        break;
      case NavigationButton.SETTINGS:
        this.router.navigate(['/settings']);
        break;
    }
  }
}
