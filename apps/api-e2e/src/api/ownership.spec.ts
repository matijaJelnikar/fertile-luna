import { INestApplication } from '@nestjs/common';
import {
  TestUser,
  authed,
  createCycle,
  createMeasurement,
  registerUser,
} from '../support/fixtures';
import { createTestApp } from '../support/test-app';

/**
 * Broken object-level authorization is the most likely real vulnerability in this codebase. Each
 * test here fails if its scoping clause is removed from the service — that is the point of it.
 */
describe('A user reaches only their own data', () => {
  let app: INestApplication;
  let close: () => Promise<void>;
  let alice: TestUser;
  let bob: TestUser;
  let bobCycle: string;
  let bobEntry: string;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
    alice = await registerUser(app);
    bob = await registerUser(app);

    ({ uuid: bobCycle } = await createCycle(app, bob, {
      startDate: '2026-09-01',
    }));
    ({ uuid: bobEntry } = await createMeasurement(app, bob, bobCycle, {
      date: '2026-09-02',
      temperature: 36.8,
    }));
  });

  afterAll(() => close());

  describe("another user's cycle", () => {
    it('cannot be read', async () => {
      await authed(app, alice).get(`/api/cycle/get/${bobCycle}`).expect(404);
    });

    it('cannot be updated, and is unchanged', async () => {
      await authed(app, alice)
        .put(`/api/cycle/update/${bobCycle}`)
        .send({ bleedingLength: 9 })
        .expect(404);

      const asOwner = await authed(app, bob)
        .get(`/api/cycle/get/${bobCycle}`)
        .expect(200);
      expect(asOwner.body.bleedingLength).toBe(5);
    });

    it('cannot be deleted, and still exists', async () => {
      await authed(app, alice)
        .delete(`/api/cycle/delete/${bobCycle}`)
        .expect(404);

      await authed(app, bob).get(`/api/cycle/get/${bobCycle}`).expect(200);
    });
  });

  describe("an entry in another user's cycle", () => {
    it('cannot be read', async () => {
      await authed(app, alice).get(`/api/measurement/${bobEntry}`).expect(404);
    });

    it('cannot be listed through the owning cycle', async () => {
      const response = await authed(app, alice)
        .get(`/api/measurement/getAll/${bobCycle}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('cannot be updated, and is unchanged', async () => {
      await authed(app, alice)
        .put(`/api/measurement/${bobEntry}`)
        .send({ temperature: 37.9 })
        .expect(404);

      const asOwner = await authed(app, bob)
        .get(`/api/measurement/${bobEntry}`)
        .expect(200);
      expect(asOwner.body.temperature).toBe(36.8);
    });

    it('cannot be deleted, and still exists', async () => {
      await authed(app, alice)
        .delete(`/api/measurement/${bobEntry}`)
        .expect(404);

      await authed(app, bob).get(`/api/measurement/${bobEntry}`).expect(200);
    });

    it('cannot be created', async () => {
      await authed(app, alice)
        .post(`/api/measurement/add/${bobCycle}`)
        .send({ date: '2026-09-10', temperature: 36.4 })
        .expect(404);

      const asOwner = await authed(app, bob)
        .get(`/api/measurement/getAll/${bobCycle}`)
        .expect(200);
      expect(asOwner.body).toHaveLength(1);
    });
  });

  describe('listing', () => {
    it('returns only the caller`s cycles', async () => {
      await createCycle(app, alice, { startDate: '2026-10-01' });

      const forAlice = await authed(app, alice)
        .get('/api/cycle/getAll')
        .expect(200);
      const forBob = await authed(app, bob).get('/api/cycle/getAll').expect(200);

      expect(forAlice.body.map((c: { uuid: string }) => c.uuid)).not.toContain(
        bobCycle
      );
      expect(forBob.body.map((c: { uuid: string }) => c.uuid)).toEqual([
        bobCycle,
      ]);
    });
  });
});
