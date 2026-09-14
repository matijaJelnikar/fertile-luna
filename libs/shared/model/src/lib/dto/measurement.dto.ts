import {
  BleedingOption,
  CervixFirmnessOption,
  CervixOpennessOption,
  CervixPositionOption,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '../constants/add-measurement.constants';
import { DisturbanceReason } from '../model/disturbance';

/** One day's observations. Every observation is optional, including the temperature. */
export type MeasurementDto = {
  date: Date;
  temperature?: number;
  /** Kept at its measured value; the engine excludes it from evaluation (`#R-DIST-02`). */
  disturbed?: boolean;
  disturbanceReasons?: DisturbanceReason[];
  /** Free text, for `DisturbanceReason.Other` — the book's row is free-form (`#R-DIST-01`). */
  disturbanceNote?: string;
  bleeding?: BleedingOption;
  pain?: PainOption;
  mucusFeeling?: MucusFeelingOption;
  mucusAppearance?: MucusAppearanceOption;
  cervixPosition?: CervixPositionOption;
  cervixOpenness?: CervixOpennessOption;
  /** `R-CERVIX-01` needs closed **and** firm, so firmness is its own observation. */
  cervixFirmness?: CervixFirmnessOption;
  intercourse?: IntercourseOption;
  notes?: string;
};

export type Measurement = MeasurementDto & {
  uuid: string;
};

export const hasObservation = (measurement: Partial<MeasurementDto>): boolean =>
  measurement.temperature != null ||
  measurement.bleeding != null ||
  measurement.pain != null ||
  measurement.mucusFeeling != null ||
  measurement.mucusAppearance != null ||
  measurement.cervixPosition != null ||
  measurement.cervixOpenness != null ||
  measurement.cervixFirmness != null ||
  measurement.intercourse != null ||
  (measurement.notes != null && measurement.notes.trim() !== '');
