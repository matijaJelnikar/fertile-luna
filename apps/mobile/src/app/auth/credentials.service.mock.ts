import { Credentials } from './credentials.service';

export class MockCredentialsService {
  credentials: Credentials | null = {
    email: 'test@example.test',
    token: '123',
    profileIncomplete: false,
  };

  isAuthenticated(): boolean {
    return !!this.credentials;
  }

  isProfileIncomplete(): boolean {
    return !!this.credentials?.profileIncomplete;
  }

  setCredentials(credentials?: Credentials, _remember?: boolean) {
    this.credentials = credentials || null;
  }
}
