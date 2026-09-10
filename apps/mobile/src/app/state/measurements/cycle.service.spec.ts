import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Cycle } from '@basal-temp-log-workspace/model';
import { CycleEndpoints } from '../../shared/constants/endpoints.constants';
import { CycleService } from './cycle.service';

const cycle = (
  uuid: string,
  startDate: string,
  cycleNumber: number
): Cycle => ({ uuid, startDate: new Date(startDate), bleedingLength: 5, cycleNumber });

describe('CycleService', () => {
  let service: CycleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CycleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('derived cycles', () => {
    it('ends a cycle the day before the next one starts', () => {
      service.cycles.set([
        cycle('c2', '2026-02-10', 2),
        cycle('c1', '2026-01-13', 1),
      ]);

      const [first] = service.cyclesWithDerived();

      expect(first.uuid).toBe('c1');
      expect(first.endDate).toEqual(new Date('2026-02-09'));
      expect(first.length).toBe(28);
      expect(first.isOpen).toBe(false);
    });

    it('leaves the last cycle open, with no end and no length', () => {
      service.cycles.set([
        cycle('c2', '2026-02-10', 2),
        cycle('c1', '2026-01-13', 1),
      ]);

      expect(service.openCycle()?.uuid).toBe('c2');
      expect(service.openCycle()?.endDate).toBeNull();
      expect(service.openCycle()?.length).toBeNull();
    });

    it('keeps exactly one cycle open', () => {
      service.cycles.set([
        cycle('c3', '2026-03-08', 3),
        cycle('c2', '2026-02-10', 2),
        cycle('c1', '2026-01-13', 1),
      ]);

      expect(service.cyclesWithDerived().filter((c) => c.isOpen)).toHaveLength(1);
    });

    it('follows a corrected start date, leaving no stale length behind', () => {
      service.cycles.set([
        cycle('c2', '2026-02-10', 2),
        cycle('c1', '2026-01-13', 1),
      ]);
      expect(service.cyclesWithDerived()[0].length).toBe(28);

      service.cycles.update((cycles) =>
        cycles.map((c) =>
          c.uuid === 'c1' ? { ...c, startDate: new Date('2026-01-15') } : c
        )
      );

      expect(service.cyclesWithDerived()[0].length).toBe(26);
      expect(service.cyclesWithDerived()[0].endDate).toEqual(
        new Date('2026-02-09')
      );
    });

    it('reports no cycles when none are recorded', () => {
      expect(service.cyclesWithDerived()).toEqual([]);
      expect(service.openCycle()).toBeNull();
    });
  });

  describe('startNewCycle', () => {
    it('creates the first cycle when none exists', () => {
      service
        .startNewCycle({ startDate: new Date('2026-01-13'), bleedingLength: 5 })
        .subscribe();

      const request = httpMock.expectOne(CycleEndpoints.ADD_CYCLE);
      expect(request.request.body).toEqual(
        expect.objectContaining({ cycleNumber: 1 })
      );
      request.flush(cycle('c1', '2026-01-13', 1));
    });

    it('closes the open cycle by starting a later one, writing nothing to it', () => {
      service.cycles.set([cycle('c1', '2026-01-13', 1)]);

      service
        .startNewCycle({ startDate: new Date('2026-02-10'), bleedingLength: 4 })
        .subscribe();

      const request = httpMock.expectOne(CycleEndpoints.ADD_CYCLE);
      expect(request.request.body).toEqual(
        expect.objectContaining({ cycleNumber: 2 })
      );
      request.flush(cycle('c2', '2026-02-10', 2));

      const [previous, current] = service.cyclesWithDerived();
      expect(previous.isOpen).toBe(false);
      expect(previous.endDate).toEqual(new Date('2026-02-09'));
      expect(current.isOpen).toBe(true);
      expect(service.currentCycleUuid()).toBe('c2');
    });

    it('refuses a start date before the open cycle', () => {
      service.cycles.set([cycle('c1', '2026-01-13', 1)]);
      const onError = jest.fn();

      service
        .startNewCycle({ startDate: new Date('2026-01-01'), bleedingLength: 4 })
        .subscribe({ error: onError });

      expect(onError).toHaveBeenCalled();
      httpMock.expectNone(CycleEndpoints.ADD_CYCLE);
    });
  });
});
