import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full', // Ensures exact match for the empty path
  },
  {
    path: 'home',
    loadComponent: () =>
      import(`./views/home/home.component.ts.component`).then(
        (c) => c.HomeComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'home', // Wildcard route to handle undefined paths
  },
];
