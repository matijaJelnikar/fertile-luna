import {
  BleedingOption,
  CycleWithDerived,
  MeasurementDto,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { toCycleDay } from './cycle-day';

/** Bleeding that can begin a cycle. Spotting never does (`#R-CYCLE-01`). */
const MENSTRUAL_BLEEDING: readonly BleedingOption[] = [
  BleedingOption.Light,
  BleedingOption.Medium,
  BleedingOption.Heavy,
];

/**
 * The last day of the bleeding that opened the cycle: its recorded length, or the run of bleeding
 * days recorded from day 1 when that is longer. Spotting at the tail extends the run.
 */
const openingBleedingEndsOn = (
  cycle: CycleWithDerived,
  entries: readonly MeasurementGraphData[]
): number => {
  const bleedingDays = new Set(
    entries.filter((e) => e.day !== null && e.bleeding).map((e) => e.day as number)
  );
  let last = 0;
  while (bleedingDays.has(last + 1)) last++;
  return Math.max(cycle.bleedingLength, last);
};

/**
 * The cycle a date falls in: from its start to the day before the next cycle begins, or open-ended
 * for the open cycle. `null` for a date before the first cycle.
 */
export const cycleContaining = (
  date: Date | string,
  cycles: readonly CycleWithDerived[]
): CycleWithDerived | null =>
  cycles.find(
    (cycle) =>
      toCycleDay(date, cycle.startDate) !== null &&
      (cycle.endDate === null || toCycleDay(cycle.endDate, date) !== null)
  ) ?? null;

/**
 * Whether saving this entry should offer to start a new cycle on its day: menstrual bleeding, in the
 * open cycle, after that cycle's own bleeding has ended — the day after it still continues the bleed.
 *
 * Only ever an offer. Bleeding in the middle of a cycle looks the same, and starting a cycle on the
 * wrong day would shift every later evaluation, so the user decides.
 */
export const offersNewCycle = (
  entry: Pick<MeasurementDto, 'date' | 'bleeding'>,
  cycle: CycleWithDerived | null,
  entries: readonly MeasurementGraphData[]
): boolean => {
  if (!cycle?.isOpen || !entry.bleeding || !MENSTRUAL_BLEEDING.includes(entry.bleeding)) {
    return false;
  }
  const day = toCycleDay(entry.date, cycle.startDate);
  return day !== null && day > openingBleedingEndsOn(cycle, entries) + 1;
};
