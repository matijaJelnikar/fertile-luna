import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import { CredentialsService } from './credentials.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationGuard implements CanActivate {
  private router = inject(Router);
  private credentialsService = inject(CredentialsService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.credentialsService.isProfileIncomplete()) {
      this.router.navigate(['/complete-profile'], {
        queryParams: { redirect: state.url },
        replaceUrl: true,
      });
      return false;
    }
    if (this.credentialsService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/login'], {
      queryParams: { redirect: state.url },
      replaceUrl: true,
    });
    return false;
  }
}
