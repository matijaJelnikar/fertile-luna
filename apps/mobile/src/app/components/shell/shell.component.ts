import { NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthenticationService } from '../../auth';
import { MaterialModule } from '../../material.module';

enum NavigationButton {
  HOME = '/home',
  HISTORY = '/history',
  SETTINGS = '/settings',
}

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  imports: [RouterModule, NgClass, TranslateModule, MaterialModule],
})
export class ShellComponent implements OnInit {
  selectedTab: NavigationButton = NavigationButton.HOME;
  protected Navigation: typeof NavigationButton = NavigationButton;

  constructor(
    private router: Router,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.selectedTab = this.router.url as NavigationButton;
  }

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
