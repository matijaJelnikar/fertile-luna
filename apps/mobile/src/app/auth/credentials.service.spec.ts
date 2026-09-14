import { TestBed } from '@angular/core/testing';

import { Credentials, CredentialsService } from './credentials.service';

// The service prefixes its storage key; hard-coding it here is what makes the persistence
// tests meaningful rather than circular.
const credentialsKey = 'fertileLuna_credentials';

const CREDENTIALS: Credentials = {
  email: 'me@example.test',
  token: '123',
  profileIncomplete: false,
};

const freshService = (): CredentialsService => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [CredentialsService] });
  return TestBed.inject(CredentialsService);
};

describe('CredentialsService', () => {
  let credentialsService: CredentialsService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    credentialsService = freshService();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('setCredentials', () => {
    it('authenticates the user once credentials are set', () => {
      credentialsService.setCredentials(CREDENTIALS);

      expect(credentialsService.isAuthenticated()).toBe(true);
      expect(credentialsService.credentials?.email).toBe('me@example.test');
    });

    it('persists credentials for the session by default', () => {
      credentialsService.setCredentials(CREDENTIALS);

      expect(sessionStorage.getItem(credentialsKey)).not.toBeNull();
      expect(localStorage.getItem(credentialsKey)).toBeNull();
    });

    it('persists credentials across sessions when asked to remember', () => {
      credentialsService.setCredentials(CREDENTIALS, true);

      expect(localStorage.getItem(credentialsKey)).not.toBeNull();
      expect(sessionStorage.getItem(credentialsKey)).toBeNull();
    });

    it('clears the authentication and both stores', () => {
      credentialsService.setCredentials(CREDENTIALS, true);

      credentialsService.setCredentials();

      expect(credentialsService.isAuthenticated()).toBe(false);
      expect(credentialsService.credentials).toBeNull();
      expect(sessionStorage.getItem(credentialsKey)).toBeNull();
      expect(localStorage.getItem(credentialsKey)).toBeNull();
    });
  });

  describe('on construction', () => {
    it('restores credentials remembered across sessions', () => {
      localStorage.setItem(credentialsKey, JSON.stringify(CREDENTIALS));

      expect(freshService().credentials).toEqual(CREDENTIALS);
    });

    it('starts unauthenticated when nothing is stored', () => {
      expect(freshService().isAuthenticated()).toBe(false);
    });
  });

  describe('isProfileIncomplete', () => {
    it('reports the flag carried by the credentials', () => {
      credentialsService.setCredentials({
        ...CREDENTIALS,
        profileIncomplete: true,
      });

      expect(credentialsService.isProfileIncomplete()).toBe(true);
    });

    it('is false when nobody is authenticated', () => {
      expect(credentialsService.isProfileIncomplete()).toBe(false);
    });
  });
});
