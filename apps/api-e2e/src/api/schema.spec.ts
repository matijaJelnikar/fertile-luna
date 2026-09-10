import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Measurement } from '../../../api/src/entities/measurement.entity';
import {
  TestUser,
  authed,
  createCycle,
  createMeasurement,
  registerUser,
} from '../support/fixtures';
import { createTestApp } from '../support/test-app';

describe('Schema integrity', () => {
  let app: INestApplication;
  let close: () => Promise<void>;
  let user: TestUser;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
    user = await registerUser(app);
  });

  afterAll(() => close());

  it('creates a cycle from only the values known when it starts', async () => {
    const response = await authed(app, user)
      .post('/api/cycle/add')
      .send({ startDate: '2026-02-01', bleedingLength: 5, cycleNumber: 1 })
      .expect(201);

    expect(response.body.uuid).toEqual(expect.any(String));
    // A create echoes the entity it just saved, so the date is still the parsed `Date`; a read
    // returns the `YYYY-MM-DD` the column holds. Both denote the same day.
    expect(String(response.body.startDate)).toContain('2026-02-01');

    const read = await authed(app, user)
      .get(`/api/cycle/get/${response.body.uuid}`)
      .expect(200);
    expect(read.body.startDate).toBe('2026-02-01');
  });

  it('creates a cycle without a cycle number', async () => {
    await authed(app, user)
      .post('/api/cycle/add')
      .send({ startDate: '2026-06-01', bleedingLength: 4 })
      .expect(201);
  });

  it('deletes a cycle`s entries with it, as the relation declares', async () => {
    const { uuid: cycleUuid } = await createCycle(app, user, {
      startDate: '2026-07-01',
    });
    const entry = await createMeasurement(app, user, cycleUuid, {
      date: '2026-07-02',
    });

    await authed(app, user).delete(`/api/cycle/delete/${cycleUuid}`).expect(200);

    const measurements: Repository<Measurement> = app.get(
      getRepositoryToken(Measurement)
    );
    expect(await measurements.findOneBy({ uuid: entry.uuid as never })).toBeNull();
  });

  it('stores an entry with no temperature', async () => {
    const { uuid: cycleUuid } = await createCycle(app, user, {
      startDate: '2026-08-01',
    });

    const response = await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({ date: '2026-08-03', mucusFeeling: 'Wet' })
      .expect(201);

    expect(response.body.temperature).toBeNull();
    expect(response.body.mucusFeeling).toBe('Wet');
  });
});
