import { NgClass } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { tap } from 'rxjs';
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
  router = inject(Router);
  authService = inject(AuthenticationService);
  destroyRef = inject(DestroyRef);
  selectedTab = signal<NavigationButton>(this.router.url as NavigationButton);

  protected Navigation: typeof NavigationButton = NavigationButton;

  ngOnInit(): void {
    this.registerRouteChangesListener();
  }

  registerRouteChangesListener(): void {
    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((event) => {
          if (event instanceof NavigationEnd) {
            this.selectedTab.set(this.router.url as NavigationButton);
          }
        })
      )
      .subscribe();
  }

  selectTab(navButton: NavigationButton): void {
    this.selectedTab.set(navButton);
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
