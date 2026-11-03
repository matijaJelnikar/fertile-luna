import { CycleEvaluation } from './fertility';

export type DayPhase = 'fertile' | 'infertile';

/**
 * The method's phase on a cycle day, read from the engine's result. `null` when the method cannot
 * say — and then nothing is asserted.
 */
export const phaseOnDay = (
  evaluation: CycleEvaluation | null,
  day: number
): DayPhase | null => {
  if (!evaluation) return null;

  const { preOvulatory, postOvulatory } = evaluation;
  const lastInfertile =
    preOvulatory.status === 'satisfied'
      ? preOvulatory.result.lastInfertileDay
      : null;
  if (lastInfertile !== null && day <= lastInfertile) return 'infertile';

  if (postOvulatory.status === 'satisfied') {
    return day < postOvulatory.result.infertileFromDay
      ? 'fertile'
      : 'infertile';
  }

  return preOvulatory.status === 'satisfied' ? 'fertile' : null;
};
