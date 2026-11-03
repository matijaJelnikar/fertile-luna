import {
  BleedingOption,
  CycleWithDerived,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { cycleContaining, offersNewCycle } from './cycle-start';

describe('cycleContaining', () => {
  const closed: CycleWithDerived = {
    uuid: 'c1',
    cycleNumber: 1,
    startDate: new Date(2026, 7, 16),
    bleedingLength: 5,
    isOpen: false,
    endDate: new Date(2026, 8, 14),
    length: 30,
  };
  const open: CycleWithDerived = {
    uuid: 'c2',
    cycleNumber: 2,
    startDate: new Date(2026, 8, 15),
    bleedingLength: 5,
    isOpen: true,
    endDate: null,
    length: null,
  };

  it('finds the cycle whose days include the date, first and last day included', () => {
    expect(cycleContaining(new Date(2026, 7, 16), [open, closed])?.uuid).toBe('c1');
    expect(cycleContaining(new Date(2026, 8, 14), [open, closed])?.uuid).toBe('c1');
    expect(cycleContaining(new Date(2026, 8, 15), [open, closed])?.uuid).toBe('c2');
  });

  it('files any later date in the open cycle', () => {
    expect(cycleContaining(new Date(2026, 9, 20), [open, closed])?.uuid).toBe('c2');
  });

  it('finds nothing before the first cycle', () => {
    expect(cycleContaining(new Date(2026, 6, 1), [open, closed])).toBeNull();
  });
});

const cycle = (over: Partial<CycleWithDerived> = {}): CycleWithDerived => ({
  uuid: 'c1',
  cycleNumber: 1,
  startDate: new Date(2026, 3, 1),
  bleedingLength: 5,
  isOpen: true,
  endDate: null,
  length: null,
  ...over,
});

const bleedingOn = (day: number, bleeding = BleedingOption.Medium) => ({
  date: new Date(2026, 3, day),
  bleeding,
});

const recorded = (day: number, bleeding?: BleedingOption): MeasurementGraphData => ({
  uuid: `m${day}`,
  date: new Date(2026, 3, day),
  day,
  bleeding,
});

describe('offersNewCycle', () => {
  it('offers on menstrual bleeding once the cycle`s own bleeding has ended', () => {
    expect(offersNewCycle(bleedingOn(27), cycle(), [])).toBe(true);
    expect(offersNewCycle(bleedingOn(27, BleedingOption.Light), cycle(), [])).toBe(true);
    expect(offersNewCycle(bleedingOn(27, BleedingOption.Heavy), cycle(), [])).toBe(true);
  });

  it('never offers on spotting, which cannot start a cycle', () => {
    expect(offersNewCycle(bleedingOn(27, BleedingOption.Spotting), cycle(), [])).toBe(false);
  });

  it('does not offer on a day without bleeding', () => {
    expect(offersNewCycle({ date: new Date(2026, 3, 27) }, cycle(), [])).toBe(false);
  });

  it('does not offer during the bleeding that opened the cycle, or the day it runs on', () => {
    expect(offersNewCycle(bleedingOn(3), cycle(), [])).toBe(false);
    // Recorded length 5, so day 6 still continues it.
    expect(offersNewCycle(bleedingOn(6), cycle(), [])).toBe(false);
    expect(offersNewCycle(bleedingOn(7), cycle(), [])).toBe(true);
  });

  it('follows a recorded bleed that ran longer than the length given at the start', () => {
    const entries = [1, 2, 3, 4, 5, 6, 7].map((day) => recorded(day, BleedingOption.Light));

    expect(offersNewCycle(bleedingOn(8), cycle(), entries)).toBe(false);
    expect(offersNewCycle(bleedingOn(10), cycle(), entries)).toBe(true);
  });

  it('only offers in the open cycle', () => {
    expect(offersNewCycle(bleedingOn(27), cycle({ isOpen: false }), [])).toBe(false);
    expect(offersNewCycle(bleedingOn(27), null, [])).toBe(false);
  });

  it('does not offer for a day before the cycle began', () => {
    expect(offersNewCycle({ date: new Date(2026, 2, 20), bleeding: BleedingOption.Heavy }, cycle(), [])).toBe(false);
  });
});
