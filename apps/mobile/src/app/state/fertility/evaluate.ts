import {
  CycleEvaluation,
  DayMarker,
  DoubleCheck,
  Evaluation,
  MeasurementGraphData,
  MucusSymbol,
  PlacedMeasurement,
  PreOvulatoryPhase,
  satisfied,
  unevaluable,
} from '@basal-temp-log-workspace/model';
import { classifyDay, findMucusPeak, isBetter } from './mucus';
import { disturbedDays, evaluateTemperatureShift } from './temperature';

/** `#R-FIRST-01`. */
const FIVE_DAY_RULE_DAYS = 5;
/** `#R-FIRST-02`. */
const MINUS_EIGHT = 8;
const CYCLES_FOR_MINUS_EIGHT = 12;
/** `#R-FIRST-01`'s invalidation: a first higher temperature this early retires the five-day rule. */
const FIVE_DAY_RULE_INVALIDATED_FROM_DAY = 12;

const placed = (entries: readonly MeasurementGraphData[]): PlacedMeasurement[] =>
  entries.filter((e): e is PlacedMeasurement => e.day !== null).sort((a, b) => a.day - b.day);

/** The cycle day of a cycle's first counted higher temperature, or `null` if it never rose. */
const firstHigherTemperatureDay = (entries: readonly PlacedMeasurement[]): number | null => {
  const shift = evaluateTemperatureShift(entries);
  return shift.status === 'satisfied' ? shift.result.countedDays[0] : null;
};

/**
 * The first day carrying a mucus sign at all — anything above dry or nothing.
 *
 * **This is a reading, not a captured rule.** `R-FIRST-01` and `R-FIRST-02` both apply "under double
 * check with cervical mucus on the principle whichever of the two shows first", and the captured
 * pages say a mucus sign ending the phase but never define which symbol counts as one. Treating
 * `vl` and above as a sign is the conservative choice — it ends the infertile phase earlier, never
 * later. Recorded in the reference's open questions.
 */
const firstMucusSignDay = (entries: readonly PlacedMeasurement[]): number | null => {
  for (const entry of entries) {
    const symbol = classifyDay(entry);
    if (symbol && isBetter(symbol, MucusSymbol.Dry)) return entry.day;
  }
  return null;
};

const evaluatePreOvulatory = (
  current: readonly PlacedMeasurement[],
  priorCycles: readonly (readonly PlacedMeasurement[])[]
): Evaluation<PreOvulatoryPhase> => {
  const evaluatedRises = priorCycles
    .map(firstHigherTemperatureDay)
    .filter((day): day is number => day !== null);

  const applyMucus = (
    lastInfertileDay: number,
    rule: PreOvulatoryPhase['rule']
  ): Evaluation<PreOvulatoryPhase> => {
    const signDay = firstMucusSignDay(current);
    // "Whichever of the two shows first" — the opposite principle to the post-ovulatory
    // double-check, where the LATER sign governs. Confusing the two would be a serious error.
    if (signDay !== null && signDay <= lastInfertileDay) {
      return satisfied({
        lastInfertileDay: signDay > 1 ? signDay - 1 : null,
        rule,
        endedEarlyByMucus: true,
      });
    }
    return satisfied({ lastInfertileDay, rule, endedEarlyByMucus: false });
  };

  if (evaluatedRises.length >= CYCLES_FOR_MINUS_EIGHT) {
    const earliest = Math.min(...evaluatedRises);
    return applyMucus(Math.max(earliest - MINUS_EIGHT, 0), 'R-FIRST-02');
  }

  // A woman who knows nothing about her previous cycle treats her first learning cycle as fertile
  // from the start. Vaja 16's stated answer is exactly this case: "Plodnost mora predvidevati od
  // prvega dne cikla."
  if (evaluatedRises.length === 0) return unevaluable('no-evaluated-previous-cycle');

  // Once a first higher temperature has fallen on day 12 or earlier, the five-day rule is retired
  // and minus-8 takes over — which needs twelve evaluated cycles we do not have.
  if (evaluatedRises.some((day) => day <= FIVE_DAY_RULE_INVALIDATED_FROM_DAY)) {
    return unevaluable('insufficient-history');
  }

  return applyMucus(FIVE_DAY_RULE_DAYS, 'R-FIRST-01');
};

const buildMarkers = (evaluation: Omit<CycleEvaluation, 'markers' | 'unplaceableEntries'>, disturbed: readonly number[]): DayMarker[] => {
  const markers: DayMarker[] = disturbed.map((day) => ({ day, kind: 'disturbed' as const }));

  if (evaluation.mucus.status === 'satisfied') {
    const { peakDay, countDays } = evaluation.mucus.result;
    markers.push({ day: peakDay, kind: 'mucus-peak' });
    markers.push({ day: countDays[0], kind: 'post-peak-1' });
    markers.push({ day: countDays[1], kind: 'post-peak-2' });
    markers.push({ day: countDays[2], kind: 'post-peak-3' });
  }

  if (evaluation.temperature.status === 'satisfied') {
    const { countedDays, uncountedDays } = evaluation.temperature.result;
    countedDays.forEach((day, index) => {
      markers.push({ day, kind: `temperature-counted-${index + 1}` as DayMarker['kind'] });
    });
    uncountedDays.forEach((day) => markers.push({ day, kind: 'temperature-uncounted' }));
  }

  return markers.sort((a, b) => a.day - b.day);
};

/**
 * Evaluate one cycle against the method's rules.
 *
 * Pure: it reads its arguments and returns a result. No Angular, no HTTP, nothing mutated — so the
 * Flutter rewrite can port the logic rather than the framework.
 *
 * The two signs are evaluated **independently** and combined afterwards, so neither can stop the
 * other from being reported (`#R-COMBI-02`).
 */
export const evaluateCycle = (
  currentCycle: readonly MeasurementGraphData[],
  priorCycles: readonly (readonly MeasurementGraphData[])[] = []
): CycleEvaluation => {
  const entries = placed(currentCycle);
  const prior = priorCycles.map(placed);

  const temperature = evaluateTemperatureShift(entries);
  const mucus = findMucusPeak(entries);
  const preOvulatory = evaluatePreOvulatory(entries, prior);

  // `R-COMBI-01`: the later of the two signs, and both are required. There is no single-sign
  // conclusion — a cycle where mucus was never recorded simply never reaches a confirmed phase.
  let postOvulatory: Evaluation<DoubleCheck>;
  if (temperature.status === 'satisfied' && mucus.status === 'satisfied') {
    postOvulatory = satisfied({
      infertileFromDay: Math.max(temperature.result.completedOnDay, mucus.result.completedOnDay),
      temperatureCompletedOnDay: temperature.result.completedOnDay,
      mucusCompletedOnDay: mucus.result.completedOnDay,
    });
  } else {
    postOvulatory = unevaluable('awaiting-second-sign');
  }

  const partial = { temperature, mucus, preOvulatory, postOvulatory };
  return {
    ...partial,
    markers: buildMarkers(partial, disturbedDays(entries)),
    unplaceableEntries: currentCycle.length - entries.length,
  };
};
