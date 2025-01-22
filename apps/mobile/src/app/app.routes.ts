import { Route } from '@angular/router';
import { ShellComponent } from '@basal-temp-log-workspace/components';
import { HomeComponent } from './views/home/home.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: ShellComponent, // Shell component wraps all content pages
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' }, // Default page
      { path: 'home', component: HomeComponent },
      // { path: 'history', component: HistoryComponent },
      // { path: 'settings', component: SettingsComponent },
    ],
  },

  // {
  //   path: '',
  //   redirectTo: 'home',
  //   pathMatch: 'full', // Ensures exact match for the empty path
  // },
  // {
  //   path: 'home',
  //   loadComponent: () =>
  //     import(`./views/home/home.component.ts.component`).then(
  //       (c) => c.HomeComponent
  //     ),
  // },
  // {
  //   path: '**',
  //   redirectTo: 'home', // Wildcard route to handle undefined paths
  // },
];
