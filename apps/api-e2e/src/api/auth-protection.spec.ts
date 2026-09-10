import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { VALID_PASSWORD, registerUser, uniqueEmail } from '../support/fixtures';
import { createTestApp } from '../support/test-app';

/** Every route that is not explicitly `@Public()`. Add a route, add it here. */
const protectedRoutes = [
  ['get', '/api/auth/user/me'],
  ['post', '/api/auth/user/update'],
  ['get', '/api/cycle/getAll'],
  ['post', '/api/cycle/add'],
  ['get', '/api/cycle/get/6e8bc430-9c3a-11d9-9669-0800200c9a66'],
  ['put', '/api/cycle/update/6e8bc430-9c3a-11d9-9669-0800200c9a66'],
  ['delete', '/api/cycle/delete/6e8bc430-9c3a-11d9-9669-0800200c9a66'],
  ['post', '/api/measurement/add/6e8bc430-9c3a-11d9-9669-0800200c9a66'],
  ['get', '/api/measurement/getAll/6e8bc430-9c3a-11d9-9669-0800200c9a66'],
  ['get', '/api/measurement/6e8bc430-9c3a-11d9-9669-0800200c9a66'],
  ['put', '/api/measurement/6e8bc430-9c3a-11d9-9669-0800200c9a66'],
  ['delete', '/api/measurement/6e8bc430-9c3a-11d9-9669-0800200c9a66'],
  ['get', '/api/hello'],
] as const;

describe('Routes are protected by default', () => {
  let app: INestApplication;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
  });

  afterAll(() => close());

  it.each(protectedRoutes)(
    'rejects an unauthenticated %s %s',
    async (method, url) => {
      await request(app.getHttpServer())[method](url).send({}).expect(401);
    }
  );

  it.each(protectedRoutes)(
    'rejects %s %s carrying a bogus token',
    async (method, url) => {
      await request(app.getHttpServer())
        [method](url)
        .set('Authorization', 'Bearer not.a.token')
        .send({})
        .expect(401);
    }
  );

  describe('an explicitly public route', () => {
    it('reaches register without credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: uniqueEmail(), password: VALID_PASSWORD })
        .expect(201);
    });

    it('reaches login without credentials', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(201);

      expect(response.body.access_token).toEqual(expect.any(String));
    });
  });
});
