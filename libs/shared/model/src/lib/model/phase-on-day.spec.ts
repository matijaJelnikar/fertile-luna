import { CycleEvaluation } from './fertility';
import { phaseOnDay } from './phase-on-day';

const UNEVALUATED = {
  preOvulatory: {
    status: 'unevaluable',
    missing: 'no-evaluated-previous-cycle',
  },
  postOvulatory: { status: 'unevaluable', missing: 'awaiting-second-sign' },
} as CycleEvaluation;

const EVALUATED = {
  preOvulatory: {
    status: 'satisfied',
    result: {
      lastInfertileDay: 3,
      rule: 'R-FIRST-01',
      endedEarlyByMucus: false,
    },
  },
  postOvulatory: {
    status: 'satisfied',
    result: {
      infertileFromDay: 9,
      temperatureCompletedOnDay: 9,
      mucusCompletedOnDay: 8,
    },
  },
} as CycleEvaluation;

describe('phaseOnDay', () => {
  it('asserts nothing the engine could not evaluate', () => {
    expect(phaseOnDay(null, 1)).toBeNull();
    expect(phaseOnDay(UNEVALUATED, 5)).toBeNull();
  });

  it('reads both infertile phases and the fertile days between them', () => {
    expect(phaseOnDay(EVALUATED, 3)).toBe('infertile');
    expect(phaseOnDay(EVALUATED, 4)).toBe('fertile');
    expect(phaseOnDay(EVALUATED, 8)).toBe('fertile');
    expect(phaseOnDay(EVALUATED, 9)).toBe('infertile');
  });
});
