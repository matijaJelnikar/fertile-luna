import { Measurement } from '../dto/measurement.dto';

export interface GraphData {
  day?: number;
}
export type MeasurementGraphData = Measurement & GraphData;
