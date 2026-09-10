import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '../constants/add-measurement.constants';
import { DisturbanceReason } from '../model/disturbance';
import { MeasurementDto } from './measurement.dto';

/**
 * Optional fields accept `null` so an edit can clear a value — `undefined` is dropped by JSON
 * serialization and would leave the field untouched. A cleared observation ("did not observe") is
 * a different fact from one recorded as "none" ("observed nothing"), and the engine treats them
 * differently.
 */
export type UpdateMeasurementDto = Partial<Pick<MeasurementDto, 'date'>> & {
  temperature?: number | null;
  disturbed?: boolean | null;
  disturbanceReasons?: DisturbanceReason[] | null;
  bleeding?: BleedingOption | null;
  pain?: PainOption | null;
  mucusFeeling?: MucusFeelingOption | null;
  mucusAppearance?: MucusAppearanceOption | null;
  cervixPosition?: CervixPositionOption | null;
  cervixFeeling?: CervixFeelingOption | null;
  intercourse?: IntercourseOption | null;
  notes?: string | null;
};
