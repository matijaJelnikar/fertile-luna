import { MucusFeelingOption } from '../constants/add-measurement.constants';
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
      disturbanceReasons: ['late measurement'],
    };

    expect(entry.temperature).toBe(36.42);
    expect(hasObservation(entry)).toBe(true);
  });
});
