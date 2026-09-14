/**
 * The rule engine's result.
 *
 * Every rule below reports one of three states, and the third is the point: the method
 * distinguishes "evaluated and not satisfied" from "cannot be evaluated", and collapsing the two
 * would report an absence of data as a finding. See `openspec/reference/sensiplan-rules.md`.
 *
 * Nothing here can express a risk, a probability or a recommendation. This is a charting tool: it
 * states method state and never advises an action.
 */

/** Why a rule could not be evaluated. Never a finding — always an absence. */
export type Unevaluable =
  /** No entry carries what this rule reads. */
  | 'not-recorded'
  /** Fewer values than the rule needs, so far. */
  | 'too-few-values'
  /** The rule holds but its days have not all passed yet. */
  | 'awaiting-days'
  /** `R-FIRST-01` needs the previous cycle to have an evaluated rise. */
  | 'no-evaluated-previous-cycle'
  /** `R-FIRST-02` needs twelve evaluated cycles. */
  | 'insufficient-history'
  /** The other sign of a double-check is not in yet (`R-COMBI-02`). */
  | 'awaiting-second-sign';

export type Evaluation<T> =
  | { readonly status: 'satisfied'; readonly result: T }
  | { readonly status: 'not-satisfied' }
  | { readonly status: 'unevaluable'; readonly missing: Unevaluable };

export const satisfied = <T>(result: T): Evaluation<T> => ({
  status: 'satisfied',
  result,
});
export const notSatisfied = <T>(): Evaluation<T> => ({ status: 'not-satisfied' });
export const unevaluable = <T>(missing: Unevaluable): Evaluation<T> => ({
  status: 'unevaluable',
  missing,
});

/**
 * The five symbols of the mucus scale, worst to best (`#R-MUCUS-01`).
 *
 * The order is the rule: the peak is the last day at the best symbol *this cycle* reached, whatever
 * that symbol is — a cycle topping out at `vl` still has a peak.
 */
export enum MucusSymbol {
  Nothing = 'Ø',
  Dry = 'su',
  Moist = 'vl',
  Mucus = 'S',
  BestQuality = 'S+',
}

/** Worst to best. Index into this to compare two symbols; never compare the strings. */
export const MUCUS_SCALE: readonly MucusSymbol[] = [
  MucusSymbol.Nothing,
  MucusSymbol.Dry,
  MucusSymbol.Moist,
  MucusSymbol.Mucus,
  MucusSymbol.BestQuality,
];

/** Which rule closed the temperature evaluation. */
export type TemperatureRule = 'R-TEMP-02' | 'R-TEMP-03' | 'R-TEMP-04';

export interface TemperatureShift {
  /** The highest of the six lower values — the Hilfslinie. */
  readonly helperLineTemperature: number;
  /** The six cycle days the line was drawn from, all undisturbed (`#R-DIST-02`). */
  readonly helperLineDays: readonly number[];
  /** The raised days the method counts, in order. Three, or four under `R-TEMP-03`. */
  readonly countedDays: readonly number[];
  /** Raised-window days that were skipped: a dip under `R-TEMP-04`, or a bracket. */
  readonly uncountedDays: readonly number[];
  readonly rule: TemperatureRule;
  /** The cycle day the evaluation concluded on. */
  readonly completedOnDay: number;
}

export interface MucusPeak {
  /** The last day at `bestSymbol` — identified only once quality drops (`#R-MUCUS-02`). */
  readonly peakDay: number;
  /** The best symbol this cycle reached, not a fixed threshold. */
  readonly bestSymbol: MucusSymbol;
  /** The three days counted after the peak, in order (`#R-MUCUS-03`). */
  readonly countDays: readonly number[];
  /** Evening of the third day after the peak. */
  readonly completedOnDay: number;
}

export type PreOvulatoryRule = 'R-FIRST-01' | 'R-FIRST-02';

export interface PreOvulatoryPhase {
  /**
   * The last infertile day at the start of the cycle, or `null` when the rule applies but yields
   * none. A first observed cycle has no infertile days at all (`#R-FIRST-01`, confirmed by Vaja 16).
   */
  readonly lastInfertileDay: number | null;
  readonly rule: PreOvulatoryRule;
  /** Set when mucus appeared first and ended the phase early — "whichever shows first". */
  readonly endedEarlyByMucus: boolean;
}

/** What the sheet draws above a day. Addressed by cycle day, never by array position. */
export type DayMarkerKind =
  | 'mucus-peak'
  | 'post-peak-1'
  | 'post-peak-2'
  | 'post-peak-3'
  | 'temperature-counted-1'
  | 'temperature-counted-2'
  | 'temperature-counted-3'
  | 'temperature-counted-4'
  | 'temperature-uncounted'
  | 'disturbed';

export interface DayMarker {
  readonly day: number;
  readonly kind: DayMarkerKind;
}

/** Which sign closed the post-ovulatory phase, or which is still outstanding. */
export interface DoubleCheck {
  /** The cycle day the post-ovulatory infertile phase begins — the later of the two signs. */
  readonly infertileFromDay: number;
  /** Both are always present when satisfied; the method has no single-sign conclusion. */
  readonly temperatureCompletedOnDay: number;
  readonly mucusCompletedOnDay: number;
}

export interface CycleEvaluation {
  readonly temperature: Evaluation<TemperatureShift>;
  readonly mucus: Evaluation<MucusPeak>;
  readonly preOvulatory: Evaluation<PreOvulatoryPhase>;
  /**
   * The post-ovulatory infertile phase, and it needs **both** signs (`#R-COMBI-01`). With one sign
   * in, this is `unevaluable: 'awaiting-second-sign'` while `temperature` or `mucus` above still
   * reports its own finding (`#R-COMBI-02`).
   */
  readonly postOvulatory: Evaluation<DoubleCheck>;
  readonly markers: readonly DayMarker[];
  /** Entries that carried no cycle day and so were not evaluated. Reported, never silently dropped. */
  readonly unplaceableEntries: number;
}
