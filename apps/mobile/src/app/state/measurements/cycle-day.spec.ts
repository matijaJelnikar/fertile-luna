import { toCycleDay } from './cycle-day';

describe('toCycleDay', () => {
  it('places the cycle start date on day 1', () => {
    expect(toCycleDay(new Date('2026-01-13'), new Date('2026-01-13'))).toBe(1);
  });

  it('counts the days since the cycle start', () => {
    expect(toCycleDay(new Date('2026-01-20'), new Date('2026-01-13'))).toBe(8);
  });

  it('ignores the time of day', () => {
    expect(
      toCycleDay(
        new Date('2026-01-14T23:45:00'),
        new Date('2026-01-13T06:15:00')
      )
    ).toBe(2);
  });

  it('counts across a daylight-saving transition', () => {
    // Europe/Ljubljana springs forward on 2026-03-29.
    expect(toCycleDay(new Date('2026-03-30'), new Date('2026-03-27'))).toBe(4);
  });

  it('cannot place a day before the cycle start', () => {
    expect(toCycleDay(new Date('2026-01-12'), new Date('2026-01-13'))).toBeNull();
  });

  it('cannot place a day when the cycle start is unknown', () => {
    expect(toCycleDay(new Date('2026-01-13'), null)).toBeNull();
    expect(toCycleDay(new Date('2026-01-13'), undefined)).toBeNull();
  });

  it('accepts the date strings the API returns', () => {
    expect(toCycleDay('2026-01-15', '2026-01-13')).toBe(3);
  });
});
