import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CycleWithDerived,
  MeasurementDto,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { of } from 'rxjs';

import { CycleService } from '../../state/measurements/cycle.service';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';
import { HomeService } from './home.service';

const CYCLE = {
  uuid: 'cycle-1',
  startDate: new Date('2026-04-01'),
  bleedingLength: 5,
} as CycleWithDerived;

const MEASUREMENTS: MeasurementGraphData[] = [
  { uuid: 'm-1', date: new Date('2026-04-01'), temperature: 36.4, day: 1 },
  // Unplaceable: no cycle day, so it is charted by nothing.
  { uuid: 'm-2', date: new Date('2026-03-20'), temperature: 36.6, day: null },
];

describe('HomeService', () => {
  let homeService: HomeService;

  const measurementsService = {
    measurements: signal<MeasurementGraphData[]>(MEASUREMENTS),
    placedMeasurements: signal(MEASUREMENTS.filter((m) => m.day !== null)),
    addMeasurement: jest.fn(() => of({})),
  };
  const cycleService = {
    currentCycle: signal<CycleWithDerived | null>(CYCLE),
    currentCycleUuid: signal<string | null>('cycle-1'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cycleService.currentCycle.set(CYCLE);
    cycleService.currentCycleUuid.set('cycle-1');

    TestBed.configureTestingModule({
      providers: [
        HomeService,
        { provide: MeasurementsService, useValue: measurementsService },
        { provide: CycleService, useValue: cycleService },
      ],
    });

    homeService = TestBed.inject(HomeService);
  });

  it('exposes every entry, and separately those that can be placed in the cycle', () => {
    expect(homeService.measurements()).toHaveLength(2);
    expect(homeService.placedMeasurements()).toHaveLength(1);
  });

  it('exposes the selected cycle', () => {
    expect(homeService.currentCycle()).toBe(CYCLE);
  });

  it('records a day against the selected cycle and its start date', () => {
    const entry: MeasurementDto = { date: new Date('2026-04-06'), temperature: 36.5 };

    homeService.addMeasurement(entry);

    expect(measurementsService.addMeasurement).toHaveBeenCalledWith(
      'cycle-1',
      entry,
      CYCLE.startDate
    );
  });

  it('records nothing when no cycle is selected', () => {
    cycleService.currentCycle.set(null);
    cycleService.currentCycleUuid.set(null);

    const result = homeService.addMeasurement({ date: new Date(), temperature: 36.5 });

    expect(result).toBeUndefined();
    expect(measurementsService.addMeasurement).not.toHaveBeenCalled();
  });
});
