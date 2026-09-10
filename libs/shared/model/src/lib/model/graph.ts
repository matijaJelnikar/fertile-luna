import { Measurement } from '../dto/measurement.dto';

export interface GraphData {
  /** `null` when the entry cannot be placed in its cycle. */
  day: number | null;
}

export type MeasurementGraphData = Measurement & GraphData;

/** An entry whose cycle day is known, so it can be evaluated and charted. */
export type PlacedMeasurement = Measurement & { day: number };
