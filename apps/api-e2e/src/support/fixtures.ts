import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface TestUser {
  email: string;
  password: string;
  token: string;
}

let sequence = 0;

/** A fresh address per call, so specs sharing the database never collide on the unique email. */
export const uniqueEmail = (): string =>
  `e2e-${Date.now()}-${sequence++}@example.test`;

export const VALID_PASSWORD = 'Testpass123.';

export const registerUser = async (
  app: INestApplication,
  email = uniqueEmail()
): Promise<TestUser> => {
  const response = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: VALID_PASSWORD })
    .expect(201);

  return { email, password: VALID_PASSWORD, token: response.body.access_token };
};

export const authed = (
  app: INestApplication,
  user: TestUser
): { get: AuthedCall; post: AuthedCall; put: AuthedCall; delete: AuthedCall } => {
  const call =
    (method: 'get' | 'post' | 'put' | 'delete') =>
    (url: string): request.Test =>
      request(app.getHttpServer())
        [method](url)
        .set('Authorization', `Bearer ${user.token}`);

  return {
    get: call('get'),
    post: call('post'),
    put: call('put'),
    delete: call('delete'),
  };
};

type AuthedCall = (url: string) => request.Test;

export const createCycle = async (
  app: INestApplication,
  user: TestUser,
  overrides: Record<string, unknown> = {}
): Promise<{ uuid: string }> => {
  const response = await authed(app, user)
    .post('/api/cycle/add')
    .send({ startDate: '2026-01-01', bleedingLength: 5, ...overrides })
    .expect(201);

  return response.body;
};

export const createMeasurement = async (
  app: INestApplication,
  user: TestUser,
  cycleUuid: string,
  overrides: Record<string, unknown> = {}
): Promise<{ uuid: string }> => {
  const response = await authed(app, user)
    .post(`/api/measurement/add/${cycleUuid}`)
    .send({ date: '2026-01-02', temperature: 36.6, ...overrides })
    .expect(201);

  return response.body;
};
