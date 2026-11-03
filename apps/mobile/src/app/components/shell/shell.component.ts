import {
  ChangeDetectionStrategy,
  Component,
  inject,
  resource,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthenticationService } from '../../auth';
import { CycleService } from '../../state/measurements/cycle.service';

interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatToolbar,
  ],
})
export class ShellComponent {
  private router = inject(Router);
  private authService = inject(AuthenticationService);
  private cycleService = inject(CycleService);

  // Cycles are loaded here rather than in a view, so every authenticated route
  // (home, history) has them regardless of which one is entered first.
  private cyclesResource = resource({
    loader: () => firstValueFrom(this.cycleService.getCycles()),
  });

  readonly navItems: readonly NavItem[] = [
    { path: '/home', icon: 'home', labelKey: 'nav.home' },
    { path: '/history', icon: 'show_chart', labelKey: 'nav.history' },
    { path: '/settings', icon: 'settings', labelKey: 'nav.settings' },
  ];

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
