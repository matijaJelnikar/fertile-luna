import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../support/test-app';

/** `CORS_ORIGINS` is unset in the e2e environment, so the configured default applies. */
const ALLOWED_ORIGIN = 'http://localhost:4200';

describe('Cross-origin access is restricted to known origins', () => {
  let app: INestApplication;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
  });

  afterAll(() => close());

  it('grants a listed origin', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/auth/login')
      .set('Origin', ALLOWED_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  it('grants no cross-origin access to an unknown origin', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('never answers with a wildcard', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/cycle/getAll')
      .set('Origin', ALLOWED_ORIGIN);

    expect(response.headers['access-control-allow-origin']).not.toBe('*');
  });
});
