import {
  MeasurementGraphData,
  MucusAppearanceOption,
  MucusFeelingOption,
  MucusSymbol,
  PlacedMeasurement,
} from '@basal-temp-log-workspace/model';
import { classifyDay } from './mucus';
import { evaluateCycle } from './evaluate';
import { evaluateTemperatureShift } from './temperature';

import vaja16 from './fixtures/vaja-16-mucus-evaluation.json';
import individuallyBest from './fixtures/r-mucus-02-individually-best.json';

/** The shapes this spec reads out of the fixture files. */
interface FixtureDay {
  day: number;
  mucus?: string;
  sensation?: string;
  appearance?: string;
}

/** The fixtures name symbols the way the book prints them; `O` stands in for `Ø` in JSON. */
const SYMBOLS: Record<string, MucusSymbol> = {
  O: MucusSymbol.Nothing,
  su: MucusSymbol.Dry,
  vl: MucusSymbol.Moist,
  S: MucusSymbol.Mucus,
  'S+': MucusSymbol.BestQuality,
};

/** The sheet's observation words, as the app's vocabulary spells them. */
const FEELINGS: Record<string, MucusFeelingOption> = {
  nothing: MucusFeelingOption.None,
  suho: MucusFeelingOption.Dry,
  vlazen: MucusFeelingOption.Moist,
  moker: MucusFeelingOption.Wet,
};
const APPEARANCES: Record<string, MucusAppearanceOption> = {
  nothing: MucusAppearanceOption.None,
  belkasta: MucusAppearanceOption.Creamy,
  tekoca: MucusAppearanceOption.Transparent,
  prozorna: MucusAppearanceOption.Transparent,
};

const entry = (day: number, over: Partial<PlacedMeasurement> = {}): PlacedMeasurement =>
  ({ uuid: `d${day}`, date: new Date(2026, 0, day), day, ...over }) as PlacedMeasurement;

/** A run of six sound low values, then whatever the test appends. */
const sixLow = (): PlacedMeasurement[] => [
  entry(1, { temperature: 36.5 }),
  entry(2, { temperature: 36.4 }),
  entry(3, { temperature: 36.45 }),
  entry(4, { temperature: 36.55 }),
  entry(5, { temperature: 36.6 }),
  entry(6, { temperature: 36.45 }),
];

describe('mucus classification (R-MUCUS-01)', () => {
  it('reproduces every symbol Vaja 16 prints', () => {
    const wrong = (vaja16.days as FixtureDay[])
      .filter((day) => day.sensation && day.appearance)
      .map((day) => ({
        day: day.day,
        expected: SYMBOLS[day.mucus as string],
        actual: classifyDay({
          mucusFeeling: FEELINGS[day.sensation as string],
          mucusAppearance: APPEARANCES[day.appearance as string],
        }),
      }))
      .filter((d) => d.actual !== d.expected);

    expect(wrong).toEqual([]);
  });

  it('takes a wet sensation as S+ even when nothing was seen', () => {
    expect(
      classifyDay({
        mucusFeeling: MucusFeelingOption.Wet,
        mucusAppearance: MucusAppearanceOption.None,
      })
    ).toBe(MucusSymbol.BestQuality);
  });

  it('takes a wet sensation as S+ even when the appearance is only creamy', () => {
    expect(
      classifyDay({
        mucusFeeling: MucusFeelingOption.Wet,
        mucusAppearance: MucusAppearanceOption.Creamy,
      })
    ).toBe(MucusSymbol.BestQuality);
  });

  it('cannot classify a day that records only an appearance', () => {
    expect(classifyDay({ mucusAppearance: MucusAppearanceOption.Creamy })).toBeNull();
  });

  it('separates "observed nothing" from "did not observe"', () => {
    expect(
      classifyDay({
        mucusFeeling: MucusFeelingOption.None,
        mucusAppearance: MucusAppearanceOption.None,
      })
    ).toBe(MucusSymbol.Nothing);
    expect(classifyDay({ mucusFeeling: MucusFeelingOption.None })).toBeNull();
  });
});

describe('the mucus peak (R-MUCUS-02, R-MUCUS-03)', () => {
  const fromSymbols = (days: readonly FixtureDay[]): PlacedMeasurement[] =>
    days.map((d) =>
      entry(d.day, {
        mucusFeeling:
          SYMBOLS[d.mucus as string] === MucusSymbol.BestQuality
            ? MucusFeelingOption.Wet
            : SYMBOLS[d.mucus as string] === MucusSymbol.Mucus
            ? MucusFeelingOption.Moist
            : SYMBOLS[d.mucus as string] === MucusSymbol.Moist
            ? MucusFeelingOption.Moist
            : MucusFeelingOption.Dry,
        mucusAppearance:
          SYMBOLS[d.mucus as string] === MucusSymbol.Mucus
            ? MucusAppearanceOption.Creamy
            : MucusAppearanceOption.None,
      })
    );

  it('puts the peak on the last day at the best quality, as Vaja 16 marks it', () => {
    const result = evaluateCycle(fromSymbols(vaja16.days as FixtureDay[])).mucus;

    expect(result.status).toBe('satisfied');
    if (result.status !== 'satisfied') return;
    expect(result.result.peakDay).toBe(vaja16.expected.peakDay);
    expect(result.result.countDays).toEqual([16, 17, 18]);
    expect(result.result.completedOnDay).toBe(vaja16.expected.mucusEvaluationCompletesOnDay);
  });

  it.each(individuallyBest.cases.map((c) => [c.name, c] as const))(
    'finds the peak in "%s", whatever symbol it tops out at',
    (_name, { days, expected }) => {
      const result = evaluateCycle(fromSymbols(days as FixtureDay[])).mucus;

      expect(result.status).toBe('satisfied');
      if (result.status !== 'satisfied') return;
      expect(result.result.peakDay).toBe(expected.peakDay);
      expect(result.result.bestSymbol).toBe(SYMBOLS[expected.bestQualityReached]);
    }
  );

  it('cannot name a peak until a poorer day has followed it', () => {
    const rising = fromSymbols([
      { day: 1, mucus: 'su' },
      { day: 2, mucus: 'vl' },
      { day: 3, mucus: 'S+' },
    ]);

    const result = evaluateCycle(rising).mucus;
    expect(result).toEqual({ status: 'unevaluable', missing: 'awaiting-days' });
  });

  it('reports mucus as unrecorded rather than unsatisfied when nothing was observed', () => {
    const result = evaluateCycle([entry(1, { temperature: 36.5 })]).mucus;
    expect(result).toEqual({ status: 'unevaluable', missing: 'not-recorded' });
  });
});

describe('the temperature rise (R-TEMP-02 … R-TEMP-04)', () => {
  it('closes on the third raised value when it clears 0.2 (R-TEMP-02)', () => {
    const result = evaluateTemperatureShift([
      ...sixLow(),
      entry(7, { temperature: 36.7 }),
      entry(8, { temperature: 36.65 }),
      entry(9, { temperature: 36.8 }),
    ]);

    expect(result.status).toBe('satisfied');
    if (result.status !== 'satisfied') return;
    expect(result.result.rule).toBe('R-TEMP-02');
    expect(result.result.helperLineTemperature).toBe(36.6);
    expect(result.result.countedDays).toEqual([7, 8, 9]);
    expect(result.result.completedOnDay).toBe(9);
  });

  it('waits for a fourth value when the third falls short (R-TEMP-03)', () => {
    const result = evaluateTemperatureShift([
      ...sixLow(),
      entry(7, { temperature: 36.7 }),
      entry(8, { temperature: 36.7 }),
      entry(9, { temperature: 36.75 }),
      entry(10, { temperature: 36.7 }),
    ]);

    expect(result.status).toBe('satisfied');
    if (result.status !== 'satisfied') return;
    expect(result.result.rule).toBe('R-TEMP-03');
    expect(result.result.countedDays).toEqual([7, 8, 9, 10]);
    // The fourth need only lie above the helper line; it is explicitly not held to +0.2.
    expect(result.result.completedOnDay).toBe(10);
  });

  it('skips one value at or below the line and still requires +0.2 (R-TEMP-04)', () => {
    const result = evaluateTemperatureShift([
      ...sixLow(),
      entry(7, { temperature: 36.7 }),
      entry(8, { temperature: 36.5 }),
      entry(9, { temperature: 36.7 }),
      entry(10, { temperature: 36.8 }),
    ]);

    expect(result.status).toBe('satisfied');
    if (result.status !== 'satisfied') return;
    expect(result.result.rule).toBe('R-TEMP-04');
    expect(result.result.countedDays).toEqual([7, 9, 10]);
    expect(result.result.uncountedDays).toEqual([8]);
  });

  it('skips a dip in second place and still counts three (R-TEMP-04)', () => {
    const result = evaluateTemperatureShift([
      ...sixLow(),
      entry(7, { temperature: 36.7 }),
      entry(8, { temperature: 36.55 }),
      entry(9, { temperature: 36.7 }),
      entry(10, { temperature: 36.8 }),
    ]);

    expect(result.status).toBe('satisfied');
    if (result.status !== 'satisfied') return;
    expect(result.result.rule).toBe('R-TEMP-04');
    expect(result.result.uncountedDays).toEqual([8]);
    expect(result.result.countedDays).toEqual([7, 9, 10]);
  });

  it('waits rather than concluding when a rise has begun but its days have not passed', () => {
    const result = evaluateTemperatureShift([
      ...sixLow(),
      entry(7, { temperature: 36.7 }),
      entry(8, { temperature: 36.75 }),
      entry(9, { temperature: 36.65 }),
    ]);

    // Three values above the line, the third short of +0.2, and no fourth measured yet.
    expect(result).toEqual({ status: 'unevaluable', missing: 'awaiting-days' });
  });

  it('finds no rise at all in a flat cycle, rather than inventing one', () => {
    const flat = Array.from({ length: 12 }, (_, i) => entry(i + 1, { temperature: 36.5 }));

    const result = evaluateTemperatureShift(flat);
    expect(result).toEqual({ status: 'unevaluable', missing: 'too-few-values' });
  });

  it('reports too few values rather than "no rise" early in a cycle', () => {
    const result = evaluateTemperatureShift(sixLow());
    expect(result).toEqual({ status: 'unevaluable', missing: 'too-few-values' });
  });

  it('reports nothing recorded when no day carries a temperature', () => {
    const result = evaluateTemperatureShift([entry(1), entry(2)]);
    expect(result).toEqual({ status: 'unevaluable', missing: 'not-recorded' });
  });
});

describe('disturbed values (R-DIST-02)', () => {
  it('leaves a bracketed value out of the six the helper line is drawn from', () => {
    const withSpike = [
      entry(1, { temperature: 36.5 }),
      // Vaja 16's own trap: a disturbed day far above everything around it.
      entry(2, { temperature: 37.05, disturbed: true }),
      entry(3, { temperature: 36.4 }),
      entry(4, { temperature: 36.45 }),
      entry(5, { temperature: 36.55 }),
      entry(6, { temperature: 36.6 }),
      entry(7, { temperature: 36.45 }),
      entry(8, { temperature: 36.7 }),
      entry(9, { temperature: 36.65 }),
      entry(10, { temperature: 36.8 }),
    ];

    const result = evaluateTemperatureShift(withSpike);

    expect(result.status).toBe('satisfied');
    if (result.status !== 'satisfied') return;
    // 37.05 would have been the helper line had it counted, and nothing would ever rise above it.
    expect(result.result.helperLineTemperature).toBe(36.6);
    expect(result.result.helperLineDays).not.toContain(2);
  });

  it('does not spend the R-TEMP-04 allowance on a bracket', () => {
    const result = evaluateTemperatureShift([
      ...sixLow(),
      entry(7, { temperature: 36.7 }),
      // Bracketed: skipped entirely, not counted as the one permitted dip.
      entry(8, { temperature: 36.3, disturbed: true }),
      entry(9, { temperature: 36.5 }),
      entry(10, { temperature: 36.7 }),
      entry(11, { temperature: 36.8 }),
    ]);

    expect(result.status).toBe('satisfied');
    if (result.status !== 'satisfied') return;
    // Day 9 is the dip the second exception allows; day 8 never entered the window.
    expect(result.result.rule).toBe('R-TEMP-04');
    expect(result.result.uncountedDays).toEqual([9]);
    expect(result.result.countedDays).toEqual([7, 10, 11]);
  });

  it('marks the disturbed day so the chart can draw it', () => {
    const { markers } = evaluateCycle([entry(1, { temperature: 37.0, disturbed: true })]);
    expect(markers).toEqual([{ day: 1, kind: 'disturbed' }]);
  });
});

describe('the double-check (R-COMBI-01, R-COMBI-02)', () => {
  const cycleWithBothSigns = (): PlacedMeasurement[] => [
    ...sixLow().map((e, i) =>
      i < 3
        ? { ...e, mucusFeeling: MucusFeelingOption.Wet, mucusAppearance: MucusAppearanceOption.None }
        : { ...e, mucusFeeling: MucusFeelingOption.Dry, mucusAppearance: MucusAppearanceOption.None }
    ),
    entry(7, { temperature: 36.7, mucusFeeling: MucusFeelingOption.Dry, mucusAppearance: MucusAppearanceOption.None }),
    entry(8, { temperature: 36.65, mucusFeeling: MucusFeelingOption.Dry, mucusAppearance: MucusAppearanceOption.None }),
    entry(9, { temperature: 36.8, mucusFeeling: MucusFeelingOption.Dry, mucusAppearance: MucusAppearanceOption.None }),
  ];

  it('begins the infertile phase on the later of the two signs', () => {
    const { postOvulatory, temperature, mucus } = evaluateCycle(cycleWithBothSigns());

    expect(temperature.status).toBe('satisfied');
    expect(mucus.status).toBe('satisfied');
    expect(postOvulatory.status).toBe('satisfied');
    if (postOvulatory.status !== 'satisfied') return;
    // Mucus completed on day 6, temperature on day 9 — the later governs.
    expect(postOvulatory.result.mucusCompletedOnDay).toBe(6);
    expect(postOvulatory.result.temperatureCompletedOnDay).toBe(9);
    expect(postOvulatory.result.infertileFromDay).toBe(9);
  });

  it('never confirms the phase on temperature alone, but still reports the rise', () => {
    const temperatureOnly = [
      ...sixLow(),
      entry(7, { temperature: 36.7 }),
      entry(8, { temperature: 36.65 }),
      entry(9, { temperature: 36.8 }),
    ];

    const { temperature, mucus, postOvulatory } = evaluateCycle(temperatureOnly);

    expect(temperature.status).toBe('satisfied');
    expect(mucus).toEqual({ status: 'unevaluable', missing: 'not-recorded' });
    expect(postOvulatory).toEqual({
      status: 'unevaluable',
      missing: 'awaiting-second-sign',
    });
  });
});

describe('the pre-ovulatory phase (R-FIRST-01, R-FIRST-02)', () => {
  const evaluatedCycle = (): PlacedMeasurement[] => [
    ...sixLow(),
    entry(17, { temperature: 36.7 }),
    entry(18, { temperature: 36.65 }),
    entry(19, { temperature: 36.8 }),
  ];

  it('treats a first observed cycle as fertile from day 1, as Vaja 16 states', () => {
    const { preOvulatory } = evaluateCycle(sixLow(), []);

    expect(preOvulatory).toEqual({
      status: 'unevaluable',
      missing: 'no-evaluated-previous-cycle',
    });
  });

  it('applies the five-day rule once the previous cycle has an evaluated rise', () => {
    const { preOvulatory } = evaluateCycle(sixLow(), [evaluatedCycle()]);

    expect(preOvulatory.status).toBe('satisfied');
    if (preOvulatory.status !== 'satisfied') return;
    expect(preOvulatory.result.rule).toBe('R-FIRST-01');
    expect(preOvulatory.result.lastInfertileDay).toBe(5);
  });

  it('ends the phase early when mucus shows first', () => {
    const mucusOnDayThree = sixLow().map((e) =>
      e.day === 3
        ? { ...e, mucusFeeling: MucusFeelingOption.Wet, mucusAppearance: MucusAppearanceOption.None }
        : e
    );

    const { preOvulatory } = evaluateCycle(mucusOnDayThree, [evaluatedCycle()]);

    expect(preOvulatory.status).toBe('satisfied');
    if (preOvulatory.status !== 'satisfied') return;
    // "Whichever of the two shows first" — the opposite principle to the double-check.
    expect(preOvulatory.result.endedEarlyByMucus).toBe(true);
    expect(preOvulatory.result.lastInfertileDay).toBe(2);
  });

  it('reports insufficient history rather than guessing once the five-day rule is retired', () => {
    const earlyRise = [
      ...sixLow(),
      entry(7, { temperature: 36.7 }),
      entry(8, { temperature: 36.65 }),
      entry(9, { temperature: 36.8 }),
    ];

    const { preOvulatory } = evaluateCycle(sixLow(), [earlyRise]);

    expect(preOvulatory).toEqual({
      status: 'unevaluable',
      missing: 'insufficient-history',
    });
  });

  it('uses minus-8 over the running minimum once twelve cycles are evaluated', () => {
    const twelve = Array.from({ length: 12 }, () => evaluatedCycle());

    const { preOvulatory } = evaluateCycle(sixLow(), twelve);

    expect(preOvulatory.status).toBe('satisfied');
    if (preOvulatory.status !== 'satisfied') return;
    expect(preOvulatory.result.rule).toBe('R-FIRST-02');
    // Earliest first higher temperature is day 17, so 17 - 8 = 9.
    expect(preOvulatory.result.lastInfertileDay).toBe(9);
  });
});

describe('the evaluation as a whole', () => {
  it('is deterministic and mutates nothing it was given', () => {
    const entries = sixLow();
    const snapshot = JSON.stringify(entries);

    const first = evaluateCycle(entries);
    const second = evaluateCycle(entries);

    expect(JSON.stringify(entries)).toBe(snapshot);
    expect(first).toEqual(second);
  });

  it('reports every rule as unevaluable for a cycle with no data', () => {
    const evaluation = evaluateCycle([]);

    expect(evaluation.temperature.status).toBe('unevaluable');
    expect(evaluation.mucus.status).toBe('unevaluable');
    expect(evaluation.preOvulatory.status).toBe('unevaluable');
    expect(evaluation.postOvulatory.status).toBe('unevaluable');
  });

  it('excludes entries that could not be placed in the cycle, and reports the exclusion', () => {
    const withUnplaceable = [
      ...sixLow(),
      { uuid: 'x', date: new Date(), day: null, temperature: 36.9 } as MeasurementGraphData,
    ];

    expect(evaluateCycle(withUnplaceable).unplaceableEntries).toBe(1);
  });
});
