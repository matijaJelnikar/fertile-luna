import { Route } from '@angular/router';
import { ShellComponent } from '@basal-temp-log-workspace/components';
import { AuthenticationGuard } from './auth';
import { LoginComponent } from './auth/login.component';
import { HistoryComponent } from './views/history/history.component';
import { HomeComponent } from './views/home/home.component';
import { SettingsComponent } from './views/settings/settings.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: HomeComponent,
        canActivate: [AuthenticationGuard],
      },
      {
        path: 'history',
        component: HistoryComponent,
        canActivate: [AuthenticationGuard],
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AuthenticationGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home', // Wildcard route to handle undefined paths
  },
];
