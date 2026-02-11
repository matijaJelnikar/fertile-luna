export type FertilityAnnotationType =
  | 'mucus-peak'
  | 'post-peak-1'
  | 'post-peak-2'
  | 'post-peak-3'
  | 'temp-shift-1'
  | 'temp-shift-2'
  | 'temp-shift-3'
  | 'temp-shift-4';

export type FertilityAssessment = {
  riskLevel: 'low' | 'high';
  isDoubleChecked: boolean;
  usedFactors: ('temperature' | 'mucus')[];
  helperLineTemp: number | null;
  helperLineRange: [number, number] | null;
  infertilePhaseStartIndex: number | null;
  annotations: Record<number, FertilityAnnotationType>;
};
