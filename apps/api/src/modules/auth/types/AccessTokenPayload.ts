import { UUID } from 'crypto';

/** What `AuthService.login` signs, and therefore what every protected request is scoped by. */
export type AccessTokenPayload = {
  uuid: UUID;
  email: string;
};
