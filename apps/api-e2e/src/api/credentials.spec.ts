import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  VALID_PASSWORD,
  authed,
  createCycle,
  createMeasurement,
  registerUser,
  uniqueEmail,
} from '../support/fixtures';
import { createTestApp } from '../support/test-app';

const expectNoCredential = (body: unknown): void => {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toMatch(/"password"/);
  // A bcrypt hash, wherever it might be nested.
  expect(serialized).not.toMatch(/\$2[aby]\$\d{2}\$/);
  expect(serialized).not.toContain(VALID_PASSWORD);
};

describe('No response carries credentials', () => {
  let app: INestApplication;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
  });

  afterAll(() => close());

  it('register', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: uniqueEmail(), password: VALID_PASSWORD })
      .expect(201);

    expectNoCredential(response.body);
  });

  it('login', async () => {
    const user = await registerUser(app);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(201);

    expectNoCredential(response.body);
  });

  it('reading the current user', async () => {
    const user = await registerUser(app);

    const response = await authed(app, user)
      .get('/api/auth/user/me')
      .expect(200);

    expectNoCredential(response.body);
  });

  it('creating and listing cycles, which hang off the owner', async () => {
    const user = await registerUser(app);

    const created = await authed(app, user)
      .post('/api/cycle/add')
      .send({ startDate: '2026-11-01', bleedingLength: 5 })
      .expect(201);
    expectNoCredential(created.body);

    const read = await authed(app, user)
      .get(`/api/cycle/get/${created.body.uuid}`)
      .expect(200);
    expectNoCredential(read.body);

    const listed = await authed(app, user).get('/api/cycle/getAll').expect(200);
    expectNoCredential(listed.body);
  });

  it('creating and reading entries, which hang off the cycle', async () => {
    const user = await registerUser(app);
    const { uuid: cycleUuid } = await createCycle(app, user, {
      startDate: '2026-12-01',
    });
    const entry = await createMeasurement(app, user, cycleUuid, {
      date: '2026-12-02',
    });

    const read = await authed(app, user)
      .get(`/api/measurement/${entry.uuid}`)
      .expect(200);
    expectNoCredential(read.body);

    const listed = await authed(app, user)
      .get(`/api/measurement/getAll/${cycleUuid}`)
      .expect(200);
    expectNoCredential(listed.body);
  });
});
