import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CycleService } from '../../state/measurements/cycle.service';
import { MeasurementsService } from '../../state/measurements/mesaurements.service';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  const startDate = new Date('2026-08-01');
  const measurementsService = {
    measurements: signal([]),
    updateMeasurement: jest.fn(() => of({})),
    deleteMeasurement: jest.fn(() => of({})),
  };
  const cycleService = {
    currentCycle: signal<{ uuid: string; startDate: Date } | null>({
      uuid: 'cycle-1',
      startDate,
    }),
  };

  let service: HistoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        HistoryService,
        { provide: MeasurementsService, useValue: measurementsService },
        { provide: CycleService, useValue: cycleService },
      ],
    });
    service = TestBed.inject(HistoryService);
  });

  it('passes the current cycle start date so the cycle day is recomputed', () => {
    service.updateMeasurement('m-1', { temperature: 36.9 }).subscribe();

    expect(measurementsService.updateMeasurement).toHaveBeenCalledWith(
      'm-1',
      { temperature: 36.9 },
      startDate
    );
  });

  it('still updates when no cycle is selected', () => {
    cycleService.currentCycle.set(null);

    service.updateMeasurement('m-1', { temperature: 36.9 }).subscribe();

    expect(measurementsService.updateMeasurement).toHaveBeenCalledWith(
      'm-1',
      { temperature: 36.9 },
      undefined
    );
  });

  it('delegates deletion', () => {
    service.deleteMeasurement('m-1').subscribe();

    expect(measurementsService.deleteMeasurement).toHaveBeenCalledWith('m-1');
  });
});
