import { Injectable } from '@angular/core';
import {
  CycleEvaluation,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { evaluateCycle } from './evaluate';

/**
 * Angular's doorway to the rule engine, and nothing more.
 *
 * All the method's logic lives in `evaluate.ts` and the modules beside it, which import nothing from
 * Angular. Keeping this wrapper empty is what lets the Flutter rewrite port the rules rather than
 * the framework — so resist putting anything here.
 */
@Injectable({ providedIn: 'root' })
export class FertilityService {
  evaluate(
    currentCycle: readonly MeasurementGraphData[],
    priorCycles: readonly (readonly MeasurementGraphData[])[] = []
  ): CycleEvaluation {
    return evaluateCycle(currentCycle, priorCycles);
  }
}
