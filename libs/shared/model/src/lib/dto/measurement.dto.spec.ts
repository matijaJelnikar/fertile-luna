import {
  CervixFirmnessOption,
  CervixOpennessOption,
  MucusFeelingOption,
} from '../constants/add-measurement.constants';
import { DisturbanceReason } from '../model/disturbance';
import { hasObservation, MeasurementDto } from './measurement.dto';

describe('measurement entry', () => {
  it('counts a day observed without a measurement as an entry', () => {
    const entry: MeasurementDto = {
      date: new Date('2026-09-07'),
      mucusFeeling: MucusFeelingOption.Moist,
    };

    expect(entry.temperature).toBeUndefined();
    expect(hasObservation(entry)).toBe(true);
  });

  it('counts a day with only a temperature as an entry', () => {
    expect(
      hasObservation({ date: new Date('2026-09-07'), temperature: 36.5 })
    ).toBe(true);
  });

  it('does not count a day with nothing recorded as an entry', () => {
    expect(hasObservation({ date: new Date('2026-09-07') })).toBe(false);
  });

  it('does not count whitespace in the note as an observation', () => {
    expect(
      hasObservation({ date: new Date('2026-09-07'), notes: '   ' })
    ).toBe(false);
  });

  it('keeps the measured value when the day is marked disturbed', () => {
    const entry: MeasurementDto = {
      date: new Date('2026-09-07'),
      temperature: 36.42,
      disturbed: true,
      disturbanceReasons: [DisturbanceReason.LateMeasurement],
    };

    expect(entry.temperature).toBe(36.42);
    expect(hasObservation(entry)).toBe(true);
  });

  it('records cervix firmness apart from openness, as `R-CERVIX-01` needs both', () => {
    const closedButSoft: MeasurementDto = {
      date: new Date('2026-09-07'),
      cervixOpenness: CervixOpennessOption.Closed,
      cervixFirmness: CervixFirmnessOption.Soft,
    };

    expect(hasObservation(closedButSoft)).toBe(true);
    // Neither observation implies the other: closed does not mean firm.
    expect(closedButSoft.cervixFirmness).toBe(CervixFirmnessOption.Soft);
  });

  it('counts a day with only cervix firmness as an entry', () => {
    expect(
      hasObservation({
        date: new Date('2026-09-07'),
        cervixFirmness: CervixFirmnessOption.Firm,
      })
    ).toBe(true);
  });

  it('carries several reasons for one day, and free text beside Other', () => {
    const entry: MeasurementDto = {
      date: new Date('2026-09-07'),
      temperature: 36.8,
      disturbed: true,
      disturbanceReasons: [DisturbanceReason.PoorSleep, DisturbanceReason.Other],
      // The book's own worked exercise records "karneval"; no enumeration would hold it.
      disturbanceNote: 'karneval',
    };

    expect(entry.disturbanceReasons).toHaveLength(2);
    expect(entry.disturbanceNote).toBe('karneval');
  });
});
