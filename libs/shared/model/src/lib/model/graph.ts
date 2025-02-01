import { MeasurementDto } from '../dto/measurement.dto';

export interface GraphData {
  day?: number;
}
export type MeasurementGraphData = MeasurementDto & GraphData;
