import { Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { LoginResponse } from '@basal-temp-log-workspace/model';
import { LoginFlowEndpoints } from '../shared/constants/endpoints.constants';
import { Credentials, CredentialsService } from './credentials.service';

export interface LoginContext {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Provides a base for authentication workflow.
 * The login/logout methods should be replaced with proper implementation.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(
    private credentialsService: CredentialsService,
    private http: HttpClient
  ) {}

  /**
   * Authenticates the user.
   * @param context The login parameters.
   * @return The user credentials.
   */
  login(context: LoginContext): Observable<Credentials> {
    const data = {
      email: context.email,
      password: context.password,
    };

    return this.http.post<LoginResponse>(LoginFlowEndpoints.LOGIN, data).pipe(
      tap((loginResponse: LoginResponse) => {
        this.credentialsService.setCredentials(
          {
            email: context.email,
            token: loginResponse.access_token,
            profileIncomplete: loginResponse.profileIncomplete,
          },
          context.remember
        );
      }),
      map((res: LoginResponse) => {
        return {
          email: context.email,
          token: res.access_token,
        } as Credentials;
      })
    );
  }

  register(userData: unknown): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(LoginFlowEndpoints.REGISTER, userData);
  }

  /**
   * Logs out the user and clear credentials.
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    // Customize credentials invalidation here
    this.credentialsService.setCredentials();
    return of(true);
  }
}
