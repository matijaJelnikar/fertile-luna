import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthenticationService, CredentialsService } from '../auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private credentialsService = inject(CredentialsService);
  private authService = inject(AuthenticationService);
  private router = inject(Router);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Retrieve the token from localStorage or sessionStorage
    const token = this.credentialsService?.credentials?.token;

    if (token) {
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next.handle(clonedRequest).pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    }

    return next.handle(req);
  }
}
