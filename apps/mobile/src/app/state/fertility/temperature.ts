import {
  Evaluation,
  PlacedMeasurement,
  TemperatureRule,
  TemperatureShift,
  satisfied,
  unevaluable,
} from '@basal-temp-log-workspace/model';

/** Two squares on the sheet (`#R-TEMP-02`). */
const REQUIRED_RISE = 0.2;
const WINDOW = 6;

/** A day whose temperature counts as evidence: recorded, and not bracketed (`#R-DIST-02`). */
interface SoundValue {
  readonly day: number;
  readonly temperature: number;
}

/**
 * The values the method compares. A disturbed value is bracketed and **not taken into account** at
 * all, so it is not one of the six and it is not one of the three — it is skipped, and the window
 * reaches further back. Skipping it does not spend `R-TEMP-04`'s allowance: a bracket says the
 * measurement is not evidence, the allowance says a sound measurement dipped.
 */
const soundValues = (entries: readonly PlacedMeasurement[]): SoundValue[] =>
  entries
    .filter((e) => e.temperature != null && !e.disturbed)
    .map((e) => ({ day: e.day, temperature: e.temperature as number }))
    .sort((a, b) => a.day - b.day);

export const disturbedDays = (entries: readonly PlacedMeasurement[]): number[] =>
  entries.filter((e) => e.disturbed).map((e) => e.day).sort((a, b) => a - b);

/**
 * Evaluate the temperature rise (`#R-TEMP-01` … `#R-TEMP-04`).
 *
 * Day by day, look for the first value higher than all six preceding sound values. Draw the helper
 * line through the highest of those six. Then:
 *
 * - **`R-TEMP-02`** three consecutive higher values, the third at least 0.2 °C above the line;
 * - **`R-TEMP-03`** if the third falls short, a fourth that need only lie above the line;
 * - **`R-TEMP-04`** one of the three may sit at or below the line, uncounted, and then the third
 *   *counted* value must be 0.2 °C above it.
 *
 * The two exceptions may never be combined, so each candidate window is tried under the standard
 * rule, then under exactly one exception.
 */
export const evaluateTemperatureShift = (
  entries: readonly PlacedMeasurement[]
): Evaluation<TemperatureShift> => {
  const values = soundValues(entries);
  if (values.length === 0) return unevaluable('not-recorded');
  if (values.length < WINDOW + 3) return unevaluable('too-few-values');

  // A candidate window that runs past the last measured day has not failed — it is unfinished.
  let truncated = false;

  for (let i = WINDOW; i < values.length; i++) {
    const six = values.slice(i - WINDOW, i);
    const helperLine = Math.max(...six.map((v) => v.temperature));
    if (values[i].temperature <= helperLine) continue;

    const shift = evaluateWindow(values, i, six, helperLine);
    if (shift) return satisfied(shift);
    // Both exceptions can read a fourth value, so a window is only conclusively failed once four
    // days have been measured after the six.
    if (i + 3 >= values.length) truncated = true;
  }

  return unevaluable(truncated ? 'awaiting-days' : 'too-few-values');
};

const buildShift = (
  six: readonly SoundValue[],
  helperLine: number,
  counted: readonly SoundValue[],
  uncounted: readonly SoundValue[],
  rule: TemperatureRule
): TemperatureShift => ({
  helperLineTemperature: helperLine,
  helperLineDays: six.map((v) => v.day),
  countedDays: counted.map((v) => v.day),
  uncountedDays: uncounted.map((v) => v.day),
  rule,
  completedOnDay: counted[counted.length - 1].day,
});

const evaluateWindow = (
  values: readonly SoundValue[],
  start: number,
  six: readonly SoundValue[],
  helperLine: number
): TemperatureShift | null => {
  const above = (v: SoundValue | undefined) => !!v && v.temperature > helperLine;
  const clears = (v: SoundValue | undefined) =>
    !!v && v.temperature - helperLine >= REQUIRED_RISE - 1e-9;

  const [first, second, third, fourth] = [
    values[start],
    values[start + 1],
    values[start + 2],
    values[start + 3],
  ];

  // R-TEMP-02 — three consecutive above the line, the third clearing 0.2.
  if (above(first) && above(second)) {
    if (above(third)) {
      if (clears(third)) {
        return buildShift(six, helperLine, [first, second, third], [], 'R-TEMP-02');
      }
      // R-TEMP-03 — the third fell short, so wait for a fourth above the line. It is explicitly
      // NOT held to 0.2, and it may not be combined with the second exception.
      if (above(fourth)) {
        return buildShift(six, helperLine, [first, second, third, fourth], [], 'R-TEMP-03');
      }
      return null;
    }

    // R-TEMP-04 — the third sits at or below the line: uncounted, unmarked, and the next value
    // becomes the third counted one, which must clear 0.2.
    if (third && above(fourth) && clears(fourth)) {
      return buildShift(six, helperLine, [first, second, fourth], [third], 'R-TEMP-04');
    }
    return null;
  }

  // R-TEMP-04 with the dip in second place.
  if (above(first) && second && !above(second) && above(third) && clears(fourth) && above(fourth)) {
    return buildShift(six, helperLine, [first, third, fourth], [second], 'R-TEMP-04');
  }

  return null;
};
