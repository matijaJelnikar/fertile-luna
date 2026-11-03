import { evaluationContextFor } from './life-phase';

const cycle = (uuid: string, startDate: string) => ({ uuid, startDate });

describe('evaluationContextFor (R-LIFE-02)', () => {
  const onThePill = cycle('c1', '2026-01-01');
  const firstAfter = cycle('c2', '2026-02-05');
  const secondAfter = cycle('c3', '2026-03-06');
  const cycles = [secondAfter, firstAfter, onThePill];

  const AFTER_BLEED = { afterHormonalContraception: { bleedingInFirstWeek: true } };
  const NO_BLEED = { afterHormonalContraception: { bleedingInFirstWeek: false } };

  it('says nothing when no stop date is recorded', () => {
    expect(evaluationContextFor(firstAfter, cycles, null)).toEqual({});
  });

  it('applies only to the first cycle beginning on or after the stop date', () => {
    expect(evaluationContextFor(firstAfter, cycles, '2026-02-01')).toEqual(AFTER_BLEED);
    expect(evaluationContextFor(secondAfter, cycles, '2026-02-01')).toEqual({});
    expect(evaluationContextFor(onThePill, cycles, '2026-02-01')).toEqual({});
  });

  it('counts a bleed on the stop date itself as within the first week', () => {
    expect(evaluationContextFor(firstAfter, cycles, '2026-02-05')).toEqual(AFTER_BLEED);
  });

  it('counts a bleed on the seventh day after stopping as within the first week', () => {
    expect(evaluationContextFor(firstAfter, cycles, '2026-01-29')).toEqual(AFTER_BLEED);
  });

  it('treats a first cycle beginning on the eighth day after stopping as having had no bleed', () => {
    expect(evaluationContextFor(firstAfter, cycles, '2026-01-28')).toEqual(NO_BLEED);
  });

  it('says nothing when no cycle has begun since stopping', () => {
    expect(evaluationContextFor(secondAfter, cycles, '2026-04-01')).toEqual({});
  });
});
