import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { VALID_PASSWORD, registerUser, uniqueEmail } from '../support/fixtures';
import { createTestApp } from '../support/test-app';

/** The only spec that runs with the real ThrottlerGuard; every other one overrides it. */
describe('Unauthenticated endpoints are rate limited', () => {
  let app: INestApplication;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, close } = await createTestApp({ throttling: true }));
  });

  afterAll(() => close());

  it('refuses repeated login attempts beyond the limit', async () => {
    const user = await registerUser(app);

    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Wrongpass123.' });

    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) {
      statuses.push((await attempt()).status);
    }

    expect(statuses).toContain(429);
    // The limit bites before the eighth attempt, not after every attempt has been served.
    expect(statuses.filter((status) => status === 429).length).toBeGreaterThan(1);
  });

  it('refuses repeated registrations beyond the limit', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) {
      statuses.push(
        (
          await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({ email: uniqueEmail(), password: VALID_PASSWORD })
        ).status
      );
    }

    expect(statuses).toContain(429);
  });

  it('answers a throttled request in the standard error shape', async () => {
    const responses = [];
    for (let i = 0; i < 8; i++) {
      responses.push(
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: uniqueEmail(), password: VALID_PASSWORD })
      );
    }

    const throttled = responses.find((response) => response.status === 429);
    expect(throttled).toBeDefined();
    expect(throttled?.body).toEqual({
      statusCode: 429,
      message: expect.anything(),
      error: expect.any(String),
    });
  });
});
