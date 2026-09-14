import { Observable, of } from 'rxjs';

import { LoginContext } from './authentication.service';
import { Credentials } from './credentials.service';

export class MockAuthenticationService {
  credentials: Credentials | null = {
    email: 'test@example.test',
    token: '123',
    profileIncomplete: false,
  };

  login(context: LoginContext): Observable<Credentials> {
    return of({
      email: context.email,
      token: '123456',
      profileIncomplete: false,
    });
  }

  logout(): Observable<boolean> {
    this.credentials = null;
    return of(true);
  }
}
