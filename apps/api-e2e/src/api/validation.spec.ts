import { INestApplication } from '@nestjs/common';
import {
  TestUser,
  authed,
  createCycle,
  registerUser,
} from '../support/fixtures';
import { createTestApp } from '../support/test-app';

describe('Request validation', () => {
  let app: INestApplication;
  let close: () => Promise<void>;
  let user: TestUser;
  let cycleUuid: string;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
    user = await registerUser(app);
    ({ uuid: cycleUuid } = await createCycle(app, user));
  });

  afterAll(() => close());

  describe('an undeclared property', () => {
    it('is rejected on cycle create, and nothing is written', async () => {
      const before = await authed(app, user).get('/api/cycle/getAll').expect(200);

      await authed(app, user)
        .post('/api/cycle/add')
        .send({ startDate: '2026-03-01', bleedingLength: 4, isPregnant: true })
        .expect(400);

      const after = await authed(app, user).get('/api/cycle/getAll').expect(200);
      expect(after.body).toHaveLength(before.body.length);
    });

    it('is rejected on measurement create, and nothing is written', async () => {
      await authed(app, user)
        .post(`/api/measurement/add/${cycleUuid}`)
        .send({ date: '2026-01-05', temperature: 36.5, mood: 'great' })
        .expect(400);

      const entries = await authed(app, user)
        .get(`/api/measurement/getAll/${cycleUuid}`)
        .expect(200);
      expect(
        entries.body.some((entry: { date: string }) => entry.date === '2026-01-05')
      ).toBe(false);
    });

    it('is rejected on measurement update', async () => {
      await authed(app, user)
        .post('/api/cycle/add')
        .send({ startDate: '2026-04-01', bleedingLength: 4, cycleNumber: 9, nope: 1 })
        .expect(400);
    });
  });

  describe('a missing required field', () => {
    it('is rejected with a message naming the field', async () => {
      const response = await authed(app, user)
        .post('/api/cycle/add')
        .send({ startDate: '2026-05-01' })
        .expect(400);

      expect(JSON.stringify(response.body.message)).toContain('bleedingLength');
    });

    it('is rejected when a measurement has no date', async () => {
      const response = await authed(app, user)
        .post(`/api/measurement/add/${cycleUuid}`)
        .send({ temperature: 36.6 })
        .expect(400);

      expect(JSON.stringify(response.body.message)).toContain('date');
    });
  });

  describe('a value outside its constraint', () => {
    it.each([12, 46, 29.9])('rejects a temperature of %p', async (temperature) => {
      await authed(app, user)
        .post(`/api/measurement/add/${cycleUuid}`)
        .send({ date: '2026-01-09', temperature })
        .expect(400);
    });

    it('rejects a temperature outside the range on update', async () => {
      const entry = await authed(app, user)
        .post(`/api/measurement/add/${cycleUuid}`)
        .send({ date: '2026-01-10', temperature: 36.4 })
        .expect(201);

      await authed(app, user)
        .put(`/api/measurement/${entry.body.uuid}`)
        .send({ temperature: 99 })
        .expect(400);
    });

    it('accepts a plausible basal temperature', async () => {
      await authed(app, user)
        .post(`/api/measurement/add/${cycleUuid}`)
        .send({ date: '2026-01-11', temperature: 36.7 })
        .expect(201);
    });
  });

  describe('a malformed identifier', () => {
    it.each([
      ['get', '/api/cycle/get/not-a-uuid'],
      ['put', '/api/cycle/update/not-a-uuid'],
      ['delete', '/api/cycle/delete/not-a-uuid'],
      ['get', '/api/measurement/getAll/not-a-uuid'],
      ['get', '/api/measurement/not-a-uuid'],
      ['delete', '/api/measurement/not-a-uuid'],
    ] as const)('rejects %s %s before any lookup', async (method, url) => {
      const response = await authed(app, user)[method](url).send({});
      expect(response.status).toBe(400);
    });
  });
});
