import { NgClass } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  resource,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom, tap } from 'rxjs';
import { AuthenticationService } from '../../auth';
import { MaterialModule } from '../../material.module';
import { CycleService } from '../../state/measurements/cycle.service';

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
  private cycleService = inject(CycleService);
  selectedTab = signal<NavigationButton>(this.router.url as NavigationButton);

  // Cycles are loaded here rather than in a view, so every authenticated route
  // (home, history) has them regardless of which one is entered first.
  private cyclesResource = resource({
    loader: () => firstValueFrom(this.cycleService.getCycles()),
  });

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
    this.router.navigate([navButton]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
