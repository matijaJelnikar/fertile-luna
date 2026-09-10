import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { registerUser } from '../support/fixtures';
import { createTestApp } from '../support/test-app';

describe('e2e harness', () => {
  let app: INestApplication;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
  });

  afterAll(() => close());

  it('boots the app against the migrated e2e database', async () => {
    const user = await registerUser(app);
    expect(user.token).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get('/api/auth/user/me')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);
  });
});
