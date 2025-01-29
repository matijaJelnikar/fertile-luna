import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '../constants/add-measurement.constants';

export type CreateMeasurementDto = {
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
