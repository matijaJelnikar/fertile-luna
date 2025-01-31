import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthenticationService } from '../../auth';
import { MaterialModule } from '../../material.module';

enum NavigationButton {
  HOME = 'HOME',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
}

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  imports: [RouterModule, NgClass, TranslateModule, MaterialModule],
})
export class ShellComponent {
  selectedTab: NavigationButton = NavigationButton.HOME;
  isLoggedIn = true;
  protected Navigation: typeof NavigationButton = NavigationButton;

  constructor(
    private router: Router,
    private authService: AuthenticationService
  ) {}

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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
