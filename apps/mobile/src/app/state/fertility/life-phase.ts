import { EvaluationContext } from '@basal-temp-log-workspace/model';
import { toCycleDay } from '../measurements/cycle-day';

/** "The first week" after stopping hormonal contraception (`#R-LIFE-02`). */
const FIRST_WEEK_DAYS = 7;

interface CycleStart {
  readonly uuid: string;
  readonly startDate: Date | string;
}

/**
 * The situation a cycle is evaluated in, from facts recorded outside the cycle itself.
 *
 * The first cycle after stopping hormonal contraception is the first cycle beginning on or after the
 * stop date; the date is recorded once for the woman, not per cycle. A cycle still begins only on a
 * bleed, so "no bleeding in the first week" means that first cycle began after it. Both settled with
 * the project owner on 2026-09-15.
 */
export const evaluationContextFor = (
  cycle: CycleStart | null,
  cycles: readonly CycleStart[],
  contraceptionStoppedOn: Date | string | null | undefined
): EvaluationContext => {
  if (!cycle || !contraceptionStoppedOn) return {};

  const [first] = cycles
    .map((candidate) => ({ candidate, day: toCycleDay(candidate.startDate, contraceptionStoppedOn) }))
    .filter((c): c is { candidate: CycleStart; day: number } => c.day !== null)
    .sort((a, b) => a.day - b.day);
  if (first?.candidate.uuid !== cycle.uuid) return {};

  // `toCycleDay` counts the stop date itself as day 1, so the days after stopping are one fewer.
  return {
    afterHormonalContraception: { bleedingInFirstWeek: first.day - 1 <= FIRST_WEEK_DAYS },
  };
};
