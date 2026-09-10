import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestUser, authed, registerUser } from '../support/fixtures';
import { createTestApp } from '../support/test-app';

const expectStandardShape = (body: unknown): void => {
  expect(body).toEqual({
    statusCode: expect.any(Number),
    message: expect.anything(),
    error: expect.any(String),
  });
};

/** Anything that names a column, a table, a file or a query is a leak. */
const leakedInternals = [
  /select /i,
  /insert into/i,
  /update .* set /i,
  /\bcharacter varying\b/i,
  /QueryFailedError/,
  /node_modules/,
  /\/home\//,
  /\.ts:\d+/,
  /at [A-Za-z]+\./,
];

describe('Errors have one shape and reveal nothing internal', () => {
  let app: INestApplication;
  let close: () => Promise<void>;
  let user: TestUser;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
    user = await registerUser(app);
  });

  afterAll(() => close());

  it('gives a database failure a generic message with no SQL, path or stack', async () => {
    // `username` is `varchar(30)`; nothing validates its length, so this reaches Postgres and
    // comes back as a QueryFailedError naming the column and its type.
    const response = await authed(app, user)
      .post('/api/auth/user/update')
      .send({ username: 'a'.repeat(200) })
      .expect(500);

    expectStandardShape(response.body);
    expect(response.body.message).toBe('Internal server error');

    const serialized = JSON.stringify(response.body);
    for (const pattern of leakedInternals) {
      expect(serialized).not.toMatch(pattern);
    }
  });

  it.each([
    ['a validation failure', 400, () => authed(app, user).post('/api/cycle/add').send({})],
    [
      'a missing resource',
      404,
      () =>
        authed(app, user).get(
          '/api/cycle/get/6e8bc430-9c3a-11d9-9669-0800200c9a66'
        ),
    ],
    [
      'an unauthenticated request',
      401,
      () => request(app.getHttpServer()).get('/api/cycle/getAll'),
    ],
    [
      'a malformed identifier',
      400,
      () => authed(app, user).get('/api/cycle/get/nope'),
    ],
  ])('gives %s the same shape', async (_name, status, call) => {
    const response = await call().expect(status);

    expectStandardShape(response.body);
    expect(response.body.statusCode).toBe(status);
  });
});
