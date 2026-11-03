import {
  CervixClosure,
  CervixFirmnessOption,
  CervixOpennessOption,
  Evaluation,
  PlacedMeasurement,
  notSatisfied,
  satisfied,
  unevaluable,
} from '@basal-temp-log-workspace/model';

type CervixField = 'cervixOpenness' | 'cervixFirmness';

/** The two observations both cervix rules read. Position is recorded but neither rule compares it. */
const CERVIX_FIELDS: readonly CervixField[] = ['cervixOpenness', 'cervixFirmness'];

const isRecorded = (entry: PlacedMeasurement): boolean =>
  CERVIX_FIELDS.some((field) => entry[field] != null);

/** Closed **and** firm, both recorded. Closed but soft, or closed with firmness unrecorded, is not. */
const isClosedAndFirm = (entry: PlacedMeasurement): boolean =>
  entry.cervixOpenness === CervixOpennessOption.Closed &&
  entry.cervixFirmness === CervixFirmnessOption.Firm;

/** The last day of the bleeding that opens the cycle: consecutive days from day 1 carrying bleeding. */
const lastMenstruationDay = (entries: readonly PlacedMeasurement[]): number => {
  let last = 0;
  for (const entry of entries) {
    if (entry.day !== last + 1 || entry.bleeding == null) break;
    last = entry.day;
  }
  return last;
};

/**
 * The cervix sign after ovulation (`#R-CERVIX-01`): three consecutive days recorded closed and firm,
 * counted after the last day it was recorded otherwise, complete on the evening of the third.
 *
 * "Consecutive" is the project owner's reading (2026-09-15) of a sentence that does not say: a day
 * with no cervix record restarts the count, as an open or soft day does. It is the strictest reading
 * considered, so it never ends the fertile phase earlier than another would.
 *
 * Entries must be sorted by day.
 */
export const evaluateCervixClosure = (
  entries: readonly PlacedMeasurement[]
): Evaluation<CervixClosure> => {
  const recorded = entries.filter(isRecorded);
  if (recorded.length === 0) return unevaluable('not-recorded');

  const otherwise = recorded.filter((entry) => !isClosedAndFirm(entry));
  // Never recorded open or soft: there is no change for a closure to follow.
  if (otherwise.length === 0) return notSatisfied();

  const lastOpenDay = otherwise[otherwise.length - 1].day;
  // Every day recorded after the last open or soft one is closed and firm by construction.
  const closed = new Set(
    recorded.filter((entry) => entry.day > lastOpenDay).map((entry) => entry.day)
  );
  for (const day of closed) {
    if (closed.has(day + 1) && closed.has(day + 2)) {
      return satisfied({
        lastOpenDay,
        closedDays: [day, day + 1, day + 2],
        completedOnDay: day + 2,
      });
    }
  }

  return unevaluable('awaiting-days');
};

/**
 * The first day the cervix changed after menstruation (`#R-CERVIX-02`), or `null`.
 *
 * A change is an openness or firmness different from that field's first observation after the
 * bleeding — settled with the project owner on 2026-09-15. A field left unrecorded on a day is not a
 * change.
 *
 * Entries must be sorted by day.
 */
export const firstCervixChangeDay = (entries: readonly PlacedMeasurement[]): number | null => {
  const menstruationEnds = lastMenstruationDay(entries);
  const after = entries.filter((entry) => entry.day > menstruationEnds);

  const changes = CERVIX_FIELDS.map((field) => {
    const baseline = after.find((entry) => entry[field] != null)?.[field];
    return after.find((entry) => entry[field] != null && entry[field] !== baseline)?.day ?? null;
  }).filter((day): day is number => day !== null);

  return changes.length > 0 ? Math.min(...changes) : null;
};
