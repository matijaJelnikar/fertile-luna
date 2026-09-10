import { INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { VALID_PASSWORD, registerUser } from '../support/fixtures';
import { createTestApp } from '../support/test-app';

describe('Security events are logged with context, never with credentials', () => {
  let app: INestApplication;
  let close: () => Promise<void>;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
  });

  afterAll(() => close());

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    warn.mockRestore();
    error.mockRestore();
  });

  it('logs a rejected unauthenticated request with the method, path and origin', async () => {
    await request(app.getHttpServer()).get('/api/cycle/getAll').expect(401);

    expect(warn).toHaveBeenCalled();
    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).toContain('GET');
    expect(logged).toContain('/api/cycle/getAll');
    expect(logged).toMatch(/127\.0\.0\.1|::1/);
  });

  it('logs a failed login without the password or the token', async () => {
    const user = await registerUser(app);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Wrongpass123.' })
      .expect(400);

    const logged = [...warn.mock.calls, ...error.mock.calls].flat().join(' ');
    expect(logged).not.toContain('Wrongpass123.');
    expect(logged).not.toContain(VALID_PASSWORD);
    expect(logged).not.toContain(user.token);
  });

  it('logs a database failure with its stack, and answers without one', async () => {
    const user = await registerUser(app);

    const response = await request(app.getHttpServer())
      .post('/api/auth/user/update')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ username: 'a'.repeat(200) })
      .expect(500);

    expect(error).toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toContain('QueryFailedError');
  });
});
