import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CredentialsService } from '../auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private credentialsService = inject(CredentialsService);

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
      return next.handle(clonedRequest);
    }

    return next.handle(req);
  }
}
