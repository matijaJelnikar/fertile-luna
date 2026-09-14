import {
  Evaluation,
  MUCUS_SCALE,
  MeasurementDto,
  MucusAppearanceOption,
  MucusFeelingOption,
  MucusPeak,
  MucusSymbol,
  PlacedMeasurement,
  notSatisfied,
  satisfied,
  unevaluable,
} from '@basal-temp-log-workspace/model';

/**
 * Appearances the book groups under `S` — thick, whitish, cloudy, creamy, flaky, yellowish, sticky,
 * tough, non-stretchy (`#R-MUCUS-01`).
 */
const S_APPEARANCES: readonly MucusAppearanceOption[] = [
  MucusAppearanceOption.Sticky,
  MucusAppearanceOption.Creamy,
];

/**
 * Appearances the book groups under `S+` — clear, egg-white-like, stretchy, can be drawn into a
 * thread, watery.
 */
const BEST_APPEARANCES: readonly MucusAppearanceOption[] = [
  MucusAppearanceOption.Transparent,
  MucusAppearanceOption.EggWhite,
];

export const isBetter = (a: MucusSymbol, b: MucusSymbol): boolean =>
  MUCUS_SCALE.indexOf(a) > MUCUS_SCALE.indexOf(b);

/**
 * A day's symbol, by the book's table (`#R-MUCUS-01`).
 *
 * The table is a lookup with one short-circuit, not a score: `S` and `S+` differ on the appearance,
 * except that a **wet, slippery** sensation gives `S+` on its own — that row is the only one joined
 * by "in/ali". Vaja 16 has days classified `S+` with nothing seen at all, which only that row
 * explains.
 *
 * Returns `null` when the day cannot be classified: the table reads both observations, so one alone
 * is not enough — except for the wet sensation, which decides the day by itself.
 */
export const classifyDay = (entry: Pick<MeasurementDto, 'mucusFeeling' | 'mucusAppearance'>): MucusSymbol | null => {
  const { mucusFeeling: feeling, mucusAppearance: appearance } = entry;

  // The short-circuit row: wet and slippery decides the day whatever was or was not seen.
  if (feeling === MucusFeelingOption.Wet) return MucusSymbol.BestQuality;

  if (feeling == null || appearance == null) return null;

  if (BEST_APPEARANCES.includes(appearance)) return MucusSymbol.BestQuality;
  if (S_APPEARANCES.includes(appearance)) return MucusSymbol.Mucus;

  // Nothing seen: the sensation alone settles it.
  if (feeling === MucusFeelingOption.Moist) return MucusSymbol.Moist;
  if (feeling === MucusFeelingOption.Dry) return MucusSymbol.Dry;
  return MucusSymbol.Nothing;
};

/**
 * The peak: the last day at the best symbol **this cycle** reached, identified only once the
 * quality has dropped (`#R-MUCUS-02`), then three days counted after it (`#R-MUCUS-03`).
 *
 * "Individually best" is not a threshold. The handbook prints two sequences side by side whose peaks
 * sit at `S+` and at `S`, so a cycle that never exceeds `vl` still has a peak on its last `vl` day.
 */
export const findMucusPeak = (entries: readonly PlacedMeasurement[]): Evaluation<MucusPeak> => {
  const classified = entries
    .map((entry) => ({ day: entry.day, symbol: classifyDay(entry) }))
    .filter((d): d is { day: number; symbol: MucusSymbol } => d.symbol !== null)
    .sort((a, b) => a.day - b.day);

  if (classified.length === 0) return unevaluable('not-recorded');

  const best = classified.reduce(
    (highest, day) => (isBetter(day.symbol, highest) ? day.symbol : highest),
    classified[0].symbol
  );

  // A cycle sitting at "nothing observed" throughout has reached no quality to peak at.
  if (best === MucusSymbol.Nothing) return notSatisfied();

  const atBest = classified.filter((d) => d.symbol === best);
  const peakDay = atBest[atBest.length - 1]?.day;
  if (peakDay === undefined) return notSatisfied();

  // The peak is retrospective: it is only the peak once a poorer day has followed it.
  const after = classified.filter((d) => d.day > peakDay);
  if (after.length === 0) return unevaluable('awaiting-days');

  const countDays = [peakDay + 1, peakDay + 2, peakDay + 3];
  const lastRecordedDay = entries.reduce((max, e) => Math.max(max, e.day), 0);
  if (lastRecordedDay < countDays[2]) return unevaluable('awaiting-days');

  return satisfied({
    peakDay,
    bestSymbol: best,
    countDays,
    completedOnDay: countDays[2],
  });
};
