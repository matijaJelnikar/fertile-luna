import { INestApplication } from '@nestjs/common';
import { DisturbanceReason } from '@basal-temp-log-workspace/model';
import {
  TestUser,
  authed,
  createCycle,
  registerUser,
} from '../support/fixtures';
import { createTestApp } from '../support/test-app';

/**
 * The daily entry as the method needs it: one entry per day, a day that may carry no temperature,
 * and a temperature that may be marked disturbed without losing its value. Each case is driven
 * through the API and read back, because the service-level specs cannot see the column types or
 * the (cycle, date) uniqueness constraint.
 */
describe('A daily entry round-trips', () => {
  let app: INestApplication;
  let close: () => Promise<void>;
  let user: TestUser;
  let cycleUuid: string;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
    user = await registerUser(app);
    ({ uuid: cycleUuid } = await createCycle(app, user, {
      startDate: '2026-04-01',
    }));
  });

  afterAll(() => close());

  const entriesForCycle = async (): Promise<Record<string, unknown>[]> => {
    const response = await authed(app, user)
      .get(`/api/measurement/getAll/${cycleUuid}`)
      .expect(200);

    return response.body;
  };

  it('keeps one entry for a day recorded twice, carrying the later values', async () => {
    await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({ date: '2026-04-05', temperature: 36.4, mucusFeeling: 'Dry' })
      .expect(201);

    await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({ date: '2026-04-05', temperature: 36.9, notes: 'measured late' })
      .expect(201);

    const forTheDay = (await entriesForCycle()).filter(
      (entry) => entry.date === '2026-04-05'
    );

    expect(forTheDay).toHaveLength(1);
    expect(forTheDay[0]).toMatchObject({
      temperature: 36.9,
      notes: 'measured late',
      // Omitted on the second save, so the first save's observation survives.
      mucusFeeling: 'Dry',
    });
  });

  it('stores and returns an entry with no temperature', async () => {
    const created = await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({ date: '2026-04-06', mucusFeeling: 'Wet', mucusAppearance: 'Egg-White' })
      .expect(201);

    const read = await authed(app, user)
      .get(`/api/measurement/${created.body.uuid}`)
      .expect(200);

    expect(read.body).toMatchObject({
      date: '2026-04-06',
      temperature: null,
      mucusFeeling: 'Wet',
      mucusAppearance: 'Egg-White',
      disturbed: false,
    });
    // An observed day is distinct from a day with no entry at all.
    expect((await entriesForCycle()).map((entry) => entry.date)).toContain(
      '2026-04-06'
    );
  });

  it('stores and returns a disturbed entry with its mark, reason and value', async () => {
    const created = await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({
        date: '2026-04-07',
        temperature: 37.1,
        disturbed: true,
        disturbanceReasons: [
          DisturbanceReason.Illness,
          DisturbanceReason.PoorSleep,
        ],
      })
      .expect(201);

    const read = await authed(app, user)
      .get(`/api/measurement/${created.body.uuid}`)
      .expect(200);

    expect(read.body).toMatchObject({
      date: '2026-04-07',
      disturbed: true,
      disturbanceReasons: ['Illness', 'Poor sleep'],
      // The mark says how to read the value; it never replaces it.
      temperature: 37.1,
    });
  });

  it('reads a disturbance mark back as removed, with the temperature untouched', async () => {
    const created = await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({
        date: '2026-04-08',
        temperature: 36.7,
        disturbed: true,
        disturbanceReasons: [DisturbanceReason.Alcohol],
      })
      .expect(201);

    await authed(app, user)
      .put(`/api/measurement/${created.body.uuid}`)
      .send({ disturbed: false, disturbanceReasons: null })
      .expect(200);

    const read = await authed(app, user)
      .get(`/api/measurement/${created.body.uuid}`)
      .expect(200);

    expect(read.body).toMatchObject({
      disturbed: false,
      disturbanceReasons: null,
      temperature: 36.7,
    });
  });

  it('carries Other beside its free text, which is what keeps the book`s row reachable', async () => {
    const created = await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({
        date: '2026-04-10',
        temperature: 36.9,
        disturbed: true,
        disturbanceReasons: [DisturbanceReason.Other],
        // The workbook's own exercise records "karneval"; no enumeration would hold it.
        disturbanceNote: 'karneval',
      })
      .expect(201);

    const read = await authed(app, user)
      .get(`/api/measurement/${created.body.uuid}`)
      .expect(200);

    expect(read.body).toMatchObject({
      disturbanceReasons: ['Other'],
      disturbanceNote: 'karneval',
    });
  });

  it('rejects a reason outside the vocabulary', async () => {
    await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({
        date: '2026-04-11',
        temperature: 36.5,
        disturbed: true,
        disturbanceReasons: ['hangover'],
      })
      .expect(400);

    expect((await entriesForCycle()).map((entry) => entry.date)).not.toContain(
      '2026-04-11'
    );
  });

  it('refuses to mark a day without a temperature as disturbed', async () => {
    await authed(app, user)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({ date: '2026-04-09', mucusFeeling: 'Dry', disturbed: true })
      .expect(400);

    expect((await entriesForCycle()).map((entry) => entry.date)).not.toContain(
      '2026-04-09'
    );
  });
});
