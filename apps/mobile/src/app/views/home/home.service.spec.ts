import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BleedingOption,
  Cycle,
  CycleWithDerived,
  MeasurementDto,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { of } from 'rxjs';

import { NewCycleDialogService } from '../../components/new-cycle/new-cycle-dialog.service';
import { CycleService } from '../../state/measurements/cycle.service';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';
import { HomeService } from './home.service';

const CYCLE: CycleWithDerived = {
  uuid: 'cycle-1',
  cycleNumber: 1,
  startDate: new Date(2026, 3, 1),
  bleedingLength: 5,
  isOpen: true,
  endDate: null,
  length: null,
};

const MEASUREMENTS: MeasurementGraphData[] = [
  { uuid: 'm-1', date: new Date(2026, 3, 1), temperature: 36.4, day: 1 },
  // Unplaceable: no cycle day, so it is charted by nothing.
  { uuid: 'm-2', date: new Date(2026, 2, 20), temperature: 36.6, day: null },
];

const PREVIOUS: CycleWithDerived = {
  ...CYCLE,
  uuid: 'cycle-0',
  cycleNumber: 0,
  startDate: new Date(2026, 2, 4),
  isOpen: false,
  length: 28,
};

const PREVIOUS_ENTRIES: MeasurementGraphData[] = [
  { uuid: 'p-1', date: new Date(2026, 2, 4), temperature: 36.3, day: 1 },
];

/** Menstrual bleeding well after the cycle's own bleeding — the day that offers a new cycle. */
const BLEEDING_DAY: MeasurementDto = {
  date: new Date(2026, 3, 28),
  bleeding: BleedingOption.Heavy,
};

describe('HomeService', () => {
  let homeService: HomeService;

  const measurementsService = {
    measurements: signal<MeasurementGraphData[]>(MEASUREMENTS),
    placedMeasurements: signal(MEASUREMENTS.filter((m) => m.day !== null)),
    addMeasurement: jest.fn(() => of({})),
    getMeasurementsByCycle: jest.fn(() => of([])),
    fetchMeasurementsByCycle: jest.fn((uuid: string) =>
      of(uuid === 'cycle-0' ? PREVIOUS_ENTRIES : [])
    ),
  };
  const cycleService = {
    currentCycle: signal<CycleWithDerived | null>(CYCLE),
    currentCycleUuid: signal<string | null>('cycle-1'),
    cyclesWithDerived: signal<CycleWithDerived[]>([CYCLE]),
    setCurrentCycle: jest.fn(),
  };
  const newCycleDialog = { start: jest.fn() };

  const done = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    cycleService.currentCycle.set(CYCLE);
    cycleService.currentCycleUuid.set('cycle-1');
    cycleService.cyclesWithDerived.set([CYCLE]);

    TestBed.configureTestingModule({
      providers: [
        HomeService,
        { provide: MeasurementsService, useValue: measurementsService },
        { provide: CycleService, useValue: cycleService },
        { provide: NewCycleDialogService, useValue: newCycleDialog },
      ],
    });

    homeService = TestBed.inject(HomeService);
  });

  it('exposes every entry, and separately those that can be placed in the cycle', () => {
    expect(homeService.measurements()).toHaveLength(2);
    expect(homeService.placedMeasurements()).toHaveLength(1);
  });

  it('loads every cycle for the history, and reads the one on screen live', async () => {
    cycleService.cyclesWithDerived.set([PREVIOUS, CYCLE]);
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));

    expect(homeService.history()).toEqual([
      { cycle: PREVIOUS, entries: PREVIOUS_ENTRIES },
      { cycle: CYCLE, entries: MEASUREMENTS },
    ]);
  });

  it('exposes the selected cycle', () => {
    expect(homeService.currentCycle()).toBe(CYCLE);
  });

  it('records a day against the selected cycle and its start date', () => {
    const entry: MeasurementDto = {
      date: new Date(2026, 3, 6),
      temperature: 36.5,
    };

    homeService.record(entry).subscribe(done);

    expect(newCycleDialog.start).not.toHaveBeenCalled();
    expect(measurementsService.addMeasurement).toHaveBeenCalledWith(
      'cycle-1',
      entry,
      CYCLE.startDate
    );
    expect(cycleService.setCurrentCycle).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalled();
  });

  it('records nothing when there is no cycle at all', () => {
    cycleService.currentCycle.set(null);
    cycleService.cyclesWithDerived.set([]);
    const onError = jest.fn();

    homeService
      .record({ date: new Date(), temperature: 36.5 })
      .subscribe({ error: onError });

    expect(onError).toHaveBeenCalled();
    expect(measurementsService.addMeasurement).not.toHaveBeenCalled();
  });

  describe('a day whose date falls in another cycle than the one on screen', () => {
    const closed: CycleWithDerived = {
      ...CYCLE,
      isOpen: false,
      endDate: new Date(2026, 3, 27),
      length: 27,
    };
    const open: CycleWithDerived = {
      ...CYCLE,
      uuid: 'cycle-2',
      cycleNumber: 2,
      startDate: new Date(2026, 3, 28),
    };

    beforeEach(() => {
      cycleService.cyclesWithDerived.set([closed, open]);
      cycleService.currentCycle.set(closed);
    });

    it('files it in the cycle its date belongs to, then shows that cycle', () => {
      const entry: MeasurementDto = {
        date: new Date(2026, 3, 29),
        bleeding: BleedingOption.Heavy,
      };

      homeService.record(entry).subscribe(done);

      expect(measurementsService.addMeasurement).toHaveBeenCalledWith(
        'cycle-2',
        entry,
        open.startDate
      );
      expect(cycleService.setCurrentCycle).toHaveBeenCalledWith('cycle-2');
      // Day 2 of the new cycle is still its own bleeding: nothing to offer.
      expect(newCycleDialog.start).not.toHaveBeenCalled();
    });
  });

  describe('a day of menstrual bleeding after the cycle`s own', () => {
    it('offers a new cycle from that day, and files the day in it once confirmed', () => {
      const started = {
        uuid: 'cycle-2',
        cycleNumber: 2,
        startDate: BLEEDING_DAY.date,
      } as Cycle;
      newCycleDialog.start.mockReturnValue(of(started));

      homeService.record(BLEEDING_DAY).subscribe(done);

      expect(newCycleDialog.start).toHaveBeenCalledWith(BLEEDING_DAY.date);
      expect(measurementsService.addMeasurement).toHaveBeenCalledWith(
        'cycle-2',
        BLEEDING_DAY,
        started.startDate
      );
      // Read again after the write, so the cycle switch's own fetch cannot hide the new day.
      expect(measurementsService.getMeasurementsByCycle).toHaveBeenCalledWith(
        'cycle-2',
        started.startDate
      );
      expect(done).toHaveBeenCalled();
    });

    it('keeps the day in the current cycle when the offer is declined', () => {
      newCycleDialog.start.mockReturnValue(of(null));

      homeService.record(BLEEDING_DAY).subscribe(done);

      expect(measurementsService.addMeasurement).toHaveBeenCalledWith(
        'cycle-1',
        BLEEDING_DAY,
        CYCLE.startDate
      );
      expect(done).toHaveBeenCalled();
    });

    it('does not offer for spotting', () => {
      homeService
        .record({ ...BLEEDING_DAY, bleeding: BleedingOption.Spotting })
        .subscribe();

      expect(newCycleDialog.start).not.toHaveBeenCalled();
      expect(measurementsService.addMeasurement).toHaveBeenCalledWith(
        'cycle-1',
        expect.anything(),
        CYCLE.startDate
      );
    });
  });
});
