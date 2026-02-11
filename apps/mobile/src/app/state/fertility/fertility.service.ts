import { Injectable } from '@angular/core';
import {
  MucusFeelingOption,
  MucusAppearanceOption,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { FertilityAnnotationType, FertilityAssessment } from '@basal-temp-log-workspace/model';

@Injectable({ providedIn: 'root' })
export class FertilityService {
  private getMucusScore(measurement: MeasurementGraphData): number {
    const hasFeeling = measurement.mucusFeeling !== undefined;
    const hasAppearance = measurement.mucusAppearance !== undefined;

    if (!hasFeeling && !hasAppearance) return -1;

    const feelingScore = this.getFeelingScore(measurement.mucusFeeling);
    const appearanceScore = this.getAppearanceScore(measurement.mucusAppearance);
    return feelingScore + appearanceScore;
  }

  private getFeelingScore(feeling: MucusFeelingOption | undefined): number {
    switch (feeling) {
      case MucusFeelingOption.Wet: return 2;
      case MucusFeelingOption.Moist: return 1;
      case MucusFeelingOption.Dry:
      case MucusFeelingOption.None:
      default: return 0;
    }
  }

  private getAppearanceScore(appearance: MucusAppearanceOption | undefined): number {
    switch (appearance) {
      case MucusAppearanceOption.EggWhite: return 4;
      case MucusAppearanceOption.Transparent: return 3;
      case MucusAppearanceOption.Creamy: return 2;
      case MucusAppearanceOption.Sticky: return 1;
      case MucusAppearanceOption.None:
      default: return 0;
    }
  }

  private findMucusPeak(
    measurements: MeasurementGraphData[]
  ): { peakIndex: number } | null {
    if (measurements.length < 2) return null;

    const scores = measurements.map((m) => this.getMucusScore(m));

    // Find the last local maximum where mucus data exists (retrospective detection)
    // Peak = last index where score[i] >= score[i+1] and score[i] > score[i-1 or start]
    // We need at least one day after peak to confirm it retrospectively
    let bestPeakIndex: number | null = null;

    for (let i = 0; i < measurements.length - 1; i++) {
      if (scores[i] < 0) continue; // no mucus data

      const isHigherThanNext = scores[i] > scores[i + 1];
      const isHigherThanPrev = i === 0 || scores[i] >= scores[i - 1];

      if (isHigherThanNext && isHigherThanPrev && scores[i] > 0) {
        bestPeakIndex = i;
      }
    }

    if (bestPeakIndex === null) return null;
    return { peakIndex: bestPeakIndex };
  }

  private findTemperatureShift(measurements: MeasurementGraphData[]): {
    confirmedIndex: number;
    helperLineTemp: number;
    helperLineStartIndex: number;
    shiftDayIndices: number[];
  } | null {
    if (measurements.length < 7) return null;

    for (let i = 6; i < measurements.length; i++) {
      const baseline = measurements.slice(i - 6, i).map((m) => m.temperature);
      const helperLineTemp = Math.max(...baseline);

      // Collect consecutive measurements above helper line starting at index i
      const candidates: number[] = [];
      for (let j = i; j < measurements.length; j++) {
        if (measurements[j].temperature > helperLineTemp) {
          candidates.push(j);
        } else {
          break;
        }
      }

      // Standard rule: 3 consecutive above helper line AND 3rd is +0.2
      if (candidates.length >= 3) {
        const third = measurements[candidates[2]].temperature;
        if (third >= helperLineTemp + 0.2) {
          return {
            confirmedIndex: candidates[2],
            helperLineTemp,
            helperLineStartIndex: i - 6,
            shiftDayIndices: candidates.slice(0, 3),
          };
        }

        // Exception 1: 3rd not +0.2 but 4th is above helper line
        if (candidates.length >= 4) {
          // Cannot combine with exception 2 — standard 3 consecutive must all be above
          return {
            confirmedIndex: candidates[3],
            helperLineTemp,
            helperLineStartIndex: i - 6,
            shiftDayIndices: candidates.slice(0, 4),
          };
        }
      }

      // Exception 2: Exactly one of 3 is at/below helper line
      // Look for a window of 4 from i where exactly one is at/below
      if (measurements.length > i + 3) {
        const window4 = [i, i + 1, i + 2, i + 3].map((idx) => ({
          idx,
          temp: measurements[idx].temperature,
          above: measurements[idx].temperature > helperLineTemp,
        }));
        const belowCount = window4.filter((p) => !p.above).length;

        if (belowCount === 1) {
          const validPoints = window4.filter((p) => p.above);
          if (validPoints.length >= 3) {
            const thirdValidTemp = validPoints[2].temp;
            if (thirdValidTemp >= helperLineTemp + 0.2) {
              return {
                confirmedIndex: validPoints[2].idx,
                helperLineTemp,
                helperLineStartIndex: i - 6,
                shiftDayIndices: validPoints.slice(0, 3).map((p) => p.idx),
              };
            }
          }
        }
      }
    }

    return null;
  }

  calculateFertility(measurements: MeasurementGraphData[]): FertilityAssessment {
    const emptyResult: FertilityAssessment = {
      riskLevel: 'high',
      isDoubleChecked: false,
      usedFactors: [],
      helperLineTemp: null,
      helperLineRange: null,
      infertilePhaseStartIndex: null,
      annotations: {},
    };

    if (measurements.length === 0) return emptyResult;

    const mucusPeak = this.findMucusPeak(measurements);
    const tempShift = this.findTemperatureShift(measurements);

    const annotations: Record<number, FertilityAnnotationType> = {};

    // Annotate mucus markers
    if (mucusPeak) {
      annotations[mucusPeak.peakIndex] = 'mucus-peak';
      const p1 = mucusPeak.peakIndex + 1;
      const p2 = mucusPeak.peakIndex + 2;
      const p3 = mucusPeak.peakIndex + 3;
      if (p1 < measurements.length) annotations[p1] = 'post-peak-1';
      if (p2 < measurements.length) annotations[p2] = 'post-peak-2';
      if (p3 < measurements.length) annotations[p3] = 'post-peak-3';
    }

    // Annotate temperature shift markers
    if (tempShift) {
      const shiftLabels: FertilityAnnotationType[] = [
        'temp-shift-1',
        'temp-shift-2',
        'temp-shift-3',
        'temp-shift-4',
      ];
      tempShift.shiftDayIndices.forEach((idx, i) => {
        annotations[idx] = shiftLabels[i];
      });
    }

    const hasMucus = mucusPeak !== null;
    const hasTemp = tempShift !== null;

    if (!hasMucus && !hasTemp) return emptyResult;

    const usedFactors: ('temperature' | 'mucus')[] = [];
    if (hasMucus) usedFactors.push('mucus');
    if (hasTemp) usedFactors.push('temperature');

    let infertilePhaseStartIndex: number | null = null;

    if (hasMucus && hasTemp) {
      const mucusCompletionIndex = mucusPeak!.peakIndex + 3;
      infertilePhaseStartIndex = Math.max(
        mucusCompletionIndex,
        tempShift!.confirmedIndex
      );
    } else if (hasTemp) {
      infertilePhaseStartIndex = tempShift!.confirmedIndex;
    } else if (hasMucus) {
      infertilePhaseStartIndex = mucusPeak!.peakIndex + 3;
    }

    const riskLevel =
      infertilePhaseStartIndex !== null &&
      infertilePhaseStartIndex < measurements.length
        ? 'low'
        : 'high';

    return {
      riskLevel,
      isDoubleChecked: hasMucus && hasTemp,
      usedFactors,
      helperLineTemp: tempShift?.helperLineTemp ?? null,
      helperLineRange: tempShift
        ? [tempShift.helperLineStartIndex, tempShift.confirmedIndex]
        : null,
      infertilePhaseStartIndex,
      annotations,
    };
  }
}
