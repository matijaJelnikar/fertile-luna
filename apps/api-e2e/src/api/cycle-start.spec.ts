import { INestApplication } from '@nestjs/common';
import { TestUser, authed, createCycle, registerUser } from '../support/fixtures';
import { createTestApp } from '../support/test-app';

/**
 * A cycle ends the day before the next one begins (`R-CYCLE-01`), so starting one takes the days
 * already recorded from its start on out of the cycle that was open until then. Driven through the
 * API, because the move is a query the service-level spec can only mock.
 */
describe('Starting a cycle', () => {
  let app: INestApplication;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
  });

  afterAll(() => close());

  const datesIn = async (owner: TestUser, cycleUuid: string): Promise<string[]> => {
    const response = await authed(app, owner)
      .get(`/api/measurement/getAll/${cycleUuid}`)
      .expect(200);
    return response.body.map((entry: { date: string }) => entry.date).sort();
  };

  const record = (owner: TestUser, cycleUuid: string, date: string) =>
    authed(app, owner)
      .post(`/api/measurement/add/${cycleUuid}`)
      .send({ date, bleeding: 'Heavy' })
      .expect(201);

  it('moves the days recorded from its start on into it, and leaves the earlier ones', async () => {
    const user = await registerUser(app);
    const { uuid: first } = await createCycle(app, user, { startDate: '2026-08-16' });
    for (const date of ['2026-08-16', '2026-09-14', '2026-09-15', '2026-09-16']) {
      await record(user, first, date);
    }

    const { uuid: second } = await createCycle(app, user, { startDate: '2026-09-15' });

    expect(await datesIn(user, first)).toEqual(['2026-08-16', '2026-09-14']);
    expect(await datesIn(user, second)).toEqual(['2026-09-15', '2026-09-16']);
  });

  it('never moves another user`s days', async () => {
    const other = await registerUser(app);
    const { uuid: theirs } = await createCycle(app, other, { startDate: '2026-08-01' });
    await record(other, theirs, '2026-09-20');

    const user = await registerUser(app);
    await createCycle(app, user, { startDate: '2026-08-01' });
    await createCycle(app, user, { startDate: '2026-09-18' });

    expect(await datesIn(other, theirs)).toEqual(['2026-09-20']);
  });
});
