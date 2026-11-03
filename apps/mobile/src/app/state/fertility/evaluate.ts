import {
  CervixClosure,
  ClassifiedDay,
  CycleEvaluation,
  DayMarker,
  DoubleCheck,
  Evaluation,
  EvaluationContext,
  MeasurementGraphData,
  MucusPeak,
  MucusSymbol,
  PlacedMeasurement,
  PreOvulatoryPhase,
  TemperatureShift,
  satisfied,
  unevaluable,
} from '@basal-temp-log-workspace/model';
import { evaluateCervixClosure, firstCervixChangeDay } from './cervix';
import { classifyDay, findMucusPeak, isBetter } from './mucus';
import {
  disturbedDays,
  evaluateTemperatureShift,
  requireFurtherRaisedValue,
} from './temperature';

/** `#R-FIRST-01`, and `#R-LIFE-02`'s five days after a bleed. */
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
  priorCycles: readonly (readonly PlacedMeasurement[])[],
  context: EvaluationContext
): Evaluation<PreOvulatoryPhase> => {
  /**
   * "Whichever shows first" — the opposite principle to the post-ovulatory double-check, where the
   * LATER sign governs. Confusing the two would be a serious error. A mucus sign or a cervix change
   * (`#R-CERVIX-02`) can end the rule's infertile days early; neither can extend them.
   */
  const applySigns = (
    lastInfertileDay: number,
    rule: PreOvulatoryPhase['rule']
  ): Evaluation<PreOvulatoryPhase> => {
    const mucusDay = firstMucusSignDay(current);
    const cervixDay = firstCervixChangeDay(current);
    const mucusFirst = mucusDay !== null && mucusDay <= lastInfertileDay;
    const cervixFirst = cervixDay !== null && cervixDay <= lastInfertileDay;

    if (!mucusFirst && !cervixFirst) {
      return satisfied({ lastInfertileDay, rule, endedEarlyByMucus: false });
    }

    const signDay = Math.min(
      mucusFirst ? (mucusDay as number) : Infinity,
      cervixFirst ? (cervixDay as number) : Infinity
    );
    return satisfied({
      lastInfertileDay: signDay > 1 ? signDay - 1 : null,
      rule,
      endedEarlyByMucus: mucusDay === signDay,
      ...(cervixDay === signDay ? { endedEarlyByCervix: true as const } : {}),
    });
  };

  // The first cycle after stopping hormonal contraception has its own rule, whatever the history
  // before it: five days from a bleed in the first week, and none without one (`#R-LIFE-02`).
  const afterContraception = context.afterHormonalContraception;
  if (afterContraception) {
    return afterContraception.bleedingInFirstWeek
      ? applySigns(FIVE_DAY_RULE_DAYS, 'R-LIFE-02')
      : satisfied({ lastInfertileDay: null, rule: 'R-LIFE-02', endedEarlyByMucus: false });
  }

  const evaluatedRises = priorCycles
    .map(firstHigherTemperatureDay)
    .filter((day): day is number => day !== null);

  if (evaluatedRises.length >= CYCLES_FOR_MINUS_EIGHT) {
    const earliest = Math.min(...evaluatedRises);
    return applySigns(Math.max(earliest - MINUS_EIGHT, 0), 'R-FIRST-02');
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

  return applySigns(FIVE_DAY_RULE_DAYS, 'R-FIRST-01');
};

/**
 * The post-ovulatory phase: the later of temperature and a second sign, and both are required
 * (`#R-COMBI-01`) — there is no single-sign conclusion.
 *
 * Where mucus is recorded it is the second sign. The cervix is the method's second option for a
 * cycle without mucus (`#R-CERVIX-01`), never an override of a mucus record — settled with the project
 * owner on 2026-09-15.
 */
const evaluatePostOvulatory = (
  temperature: Evaluation<TemperatureShift>,
  mucus: Evaluation<MucusPeak>,
  cervix: Evaluation<CervixClosure>
): Evaluation<DoubleCheck> => {
  if (temperature.status !== 'satisfied') return unevaluable('awaiting-second-sign');
  const temperatureCompletedOnDay = temperature.result.completedOnDay;

  const mucusRecorded = !(mucus.status === 'unevaluable' && mucus.missing === 'not-recorded');
  if (mucusRecorded) {
    if (mucus.status !== 'satisfied') return unevaluable('awaiting-second-sign');
    return satisfied({
      infertileFromDay: Math.max(temperatureCompletedOnDay, mucus.result.completedOnDay),
      temperatureCompletedOnDay,
      mucusCompletedOnDay: mucus.result.completedOnDay,
    });
  }

  if (cervix.status !== 'satisfied') return unevaluable('awaiting-second-sign');
  return satisfied({
    infertileFromDay: Math.max(temperatureCompletedOnDay, cervix.result.completedOnDay),
    temperatureCompletedOnDay,
    cervixCompletedOnDay: cervix.result.completedOnDay,
  });
};

type Signs = Pick<CycleEvaluation, 'temperature' | 'mucus'>;

const buildMarkers = (evaluation: Signs, disturbed: readonly number[]): DayMarker[] => {
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
 * The signs are evaluated **independently** and combined afterwards, so none can stop another from
 * being reported (`#R-COMBI-02`).
 */
export const evaluateCycle = (
  currentCycle: readonly MeasurementGraphData[],
  priorCycles: readonly (readonly MeasurementGraphData[])[] = [],
  context: EvaluationContext = {}
): CycleEvaluation => {
  const entries = placed(currentCycle);
  const prior = priorCycles.map(placed);

  const shift = evaluateTemperatureShift(entries);
  // The first raised phase after stopping hormonal contraception needs one value more (`#R-LIFE-02`).
  const temperature = context.afterHormonalContraception
    ? requireFurtherRaisedValue(shift, entries)
    : shift;
  const mucus = findMucusPeak(entries);
  const cervix = evaluateCervixClosure(entries);
  const preOvulatory = evaluatePreOvulatory(entries, prior, context);
  const postOvulatory = evaluatePostOvulatory(temperature, mucus, cervix);

  const mucusByDay = entries.reduce<ClassifiedDay[]>((days, entry) => {
    const symbol = classifyDay(entry);
    return symbol ? [...days, { day: entry.day, symbol }] : days;
  }, []);

  return {
    temperature,
    mucus,
    cervix,
    preOvulatory,
    postOvulatory,
    markers: buildMarkers({ temperature, mucus }, disturbedDays(entries)),
    mucusByDay,
    unplaceableEntries: currentCycle.length - entries.length,
  };
};
