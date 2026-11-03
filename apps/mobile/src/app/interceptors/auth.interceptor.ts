import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthenticationService, CredentialsService } from '../auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(CredentialsService).credentials?.token;
  if (!token) return next(req);

  const authService = inject(AuthenticationService);
  const router = inject(Router);

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  ).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
