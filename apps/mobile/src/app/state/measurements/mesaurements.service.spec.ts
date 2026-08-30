import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Cycle, Measurement } from '@basal-temp-log-workspace/model';
import { CycleService } from './cycle.service';
import { MeasurementsService } from './mesaurements.service';

const CYCLE: Cycle = {
  uuid: 'cycle-1',
  startDate: new Date('2026-08-01'),
  bleedingLength: 4,
};

const measurement = (
  uuid: string,
  date: string,
  temperature: number
): Measurement => ({ uuid, date: new Date(date), temperature });

describe('MeasurementsService', () => {
  let service: MeasurementsService;
  let cycleService: CycleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    cycleService = TestBed.inject(CycleService);
    service = TestBed.inject(MeasurementsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const loadCycle = (measurements: Measurement[]) => {
    service.getMeasurementsByCycle(CYCLE.uuid, CYCLE.startDate).subscribe();
    httpMock
      .expectOne(`/api/measurement/getAll/${CYCLE.uuid}`)
      .flush(measurements);
  };

  it('loads measurements for a cycle sorted by date with a cycle day', () => {
    loadCycle([
      measurement('b', '2026-08-03', 36.8),
      measurement('a', '2026-08-01', 36.4),
    ]);

    expect(service.measurements().map((m) => m.uuid)).toEqual(['a', 'b']);
    expect(service.measurements().map((m) => m.day)).toEqual([1, 3]);
  });

  it('replaces the edited measurement in state and re-sorts it', () => {
    loadCycle([
      measurement('a', '2026-08-01', 36.4),
      measurement('b', '2026-08-03', 36.8),
    ]);

    service
      .updateMeasurement('b', { temperature: 36.9 }, CYCLE.startDate)
      .subscribe();

    const request = httpMock.expectOne('/api/measurement/b');
    expect(request.request.method).toBe('PUT');
    request.flush(measurement('b', '2026-07-31', 36.9));

    expect(service.measurements().map((m) => m.uuid)).toEqual(['b', 'a']);
    expect(service.measurements()[0].temperature).toBe(36.9);
    expect(service.measurements()[0].day).toBe(0);
  });

  it('sends null so a cleared observation reaches the server', () => {
    loadCycle([measurement('a', '2026-08-01', 36.4)]);

    service.updateMeasurement('a', { notes: null }).subscribe();

    const request = httpMock.expectOne('/api/measurement/a');
    expect(request.request.body).toEqual({ notes: null });
    request.flush(measurement('a', '2026-08-01', 36.4));
  });

  it('removes the deleted measurement from state', () => {
    loadCycle([
      measurement('a', '2026-08-01', 36.4),
      measurement('b', '2026-08-03', 36.8),
    ]);

    service.deleteMeasurement('a').subscribe();

    const request = httpMock.expectOne('/api/measurement/a');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(service.measurements().map((m) => m.uuid)).toEqual(['b']);
  });

  it('loads the measurements of whichever cycle becomes current', () => {
    cycleService.cycles.set([CYCLE]);
    cycleService.setCurrentCycle(CYCLE.uuid);
    TestBed.flushEffects();

    httpMock
      .expectOne(`/api/measurement/getAll/${CYCLE.uuid}`)
      .flush([measurement('a', '2026-08-02', 36.5)]);

    expect(service.measurements()).toHaveLength(1);
    expect(service.measurements()[0].day).toBe(2);
  });
});
