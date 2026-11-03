import { toCalendarDay, toCycleDay } from './cycle-day';

describe('toCalendarDay', () => {
  it('writes the local day, not the UTC one, at either end of the day', () => {
    expect(toCalendarDay(new Date(2026, 1, 10, 0, 5))).toBe('2026-02-10');
    expect(toCalendarDay(new Date(2026, 1, 10, 23, 55))).toBe('2026-02-10');
  });

  it('pads single-digit months and days', () => {
    expect(toCalendarDay(new Date(2026, 0, 3))).toBe('2026-01-03');
  });

  it('keeps the day of a string the API returned', () => {
    expect(toCalendarDay('2026-02-10')).toBe('2026-02-10');
    expect(toCalendarDay('2026-02-10T00:00:00.000Z')).toBe('2026-02-10');
  });
});

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
