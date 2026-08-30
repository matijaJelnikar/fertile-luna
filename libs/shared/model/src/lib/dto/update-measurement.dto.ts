import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '../constants/add-measurement.constants';
import { MeasurementDto } from './measurement.dto';

/**
 * Optional fields accept `null` so an edit can clear a previously set value —
 * `undefined` would be dropped by JSON serialization and leave the field untouched.
 */
export type UpdateMeasurementDto = Partial<
  Pick<MeasurementDto, 'date' | 'temperature'>
> & {
  bleeding?: BleedingOption | null;
  pain?: PainOption | null;
  mucusFeeling?: MucusFeelingOption | null;
  mucusAppearance?: MucusAppearanceOption | null;
  cervixPosition?: CervixPositionOption | null;
  cervixFeeling?: CervixFeelingOption | null;
  intercourse?: IntercourseOption | null;
  notes?: string | null;
};
