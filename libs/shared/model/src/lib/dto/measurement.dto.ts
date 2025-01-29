import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '../constants/add-measurement.constants';

export type MeasurementDto = {
  date: Date;
  temperature: number;
  bleeding?: BleedingOption;
  pain?: PainOption;
  mucusFeeling?: MucusFeelingOption;
  mucusAppearance?: MucusAppearanceOption;
  cervixPosition?: CervixPositionOption;
  cervixFeeling?: CervixFeelingOption;
  intercourse?: IntercourseOption;
  notes?: string;
};
