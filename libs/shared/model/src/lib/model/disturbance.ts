/**
 * Why a day's temperature is marked disturbed.
 *
 * The method enumerates nothing: the workbook's "Motnje" row is free text, annotated only with
 * examples ("Vnesemo **npr.** bolezni, potovanja, dela v izmenah"), and its own worked exercise
 * records "karneval" and "sestanek, pozno spat"
 * (`openspec/reference/sensiplan-rules.md#R-DIST-01`). So this list cannot contradict the book,
 * and `Other` keeps the book's free-form row reachable.
 *
 * The reason is presentational. The rule turns on the mark alone, so the engine must never branch
 * on a value here (`#R-DIST-02`).
 */
export enum DisturbanceReason {
  /** The sheet's own three examples, PDF p06. */
  Illness = 'Illness',
  Travel = 'Travel',
  ShiftWork = 'Shift work',
  Fever = 'Fever',
  Alcohol = 'Alcohol',
  /** Short, broken or unusually late sleep. */
  PoorSleep = 'Poor sleep',
  /** Taken well outside the usual measuring time. */
  LateMeasurement = 'Late measurement',
  /** Anything the list does not cover; carried in `disturbanceNote`. */
  Other = 'Other',
}

export const DISTURBANCE_REASONS: readonly DisturbanceReason[] =
  Object.values(DisturbanceReason);
