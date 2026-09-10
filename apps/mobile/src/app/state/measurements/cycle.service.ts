import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import {
  Cycle,
  CycleDto,
  CycleWithDerived,
} from '@basal-temp-log-workspace/model';
import { tap, throwError } from 'rxjs';
import { CycleEndpoints } from '../../shared/constants/endpoints.constants';
import { toCycleDay } from './cycle-day';

@Injectable({ providedIn: 'root' })
export class CycleService {
  cycles = signal<Cycle[]>([]);
  currentCycleUuid = signal<string | null>(null);

  /** A cycle runs until the next one starts, so end and length follow from the neighbours. */
  cyclesWithDerived = computed<CycleWithDerived[]>(() => {
    const byStart = [...this.cycles()].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return byStart.map((cycle, index) => {
      const next = byStart[index + 1];
      if (!next) {
        return { ...cycle, isOpen: true, endDate: null, length: null };
      }

      const nextStart = new Date(next.startDate);
      const endDate = new Date(nextStart);
      endDate.setDate(endDate.getDate() - 1);

      return {
        ...cycle,
        isOpen: false,
        endDate,
        length: toCycleDay(nextStart, cycle.startDate)
          ? toCycleDay(nextStart, cycle.startDate)! - 1
          : null,
      };
    });
  });

  openCycle = computed(
    () => this.cyclesWithDerived().find((cycle) => cycle.isOpen) ?? null
  );

  currentCycle = computed(() => {
    const cycleUuid = this.currentCycleUuid();
    if (!cycleUuid) return null;
    return (
      this.cyclesWithDerived().find((cycle) => cycle.uuid === cycleUuid) ?? null
    );
  });

  constructor(private http: HttpClient) {}

  getCycles() {
    return this.http.get<Cycle[]>(CycleEndpoints.GET_ALL_CYCLES).pipe(
      tap((cycles) => {
        this.cycles.set(cycles);
        if (cycles.length > 0 && !this.currentCycleUuid()) {
          this.currentCycleUuid.set(cycles[0].uuid);
        }
      })
    );
  }

  getCycle(cycleUuid: string) {
    return this.http.get<Cycle>(`${CycleEndpoints.GET_CYCLE}${cycleUuid}`);
  }

  /**
   * One operation: the open cycle closes because a later one exists, not because anything is
   * written to it.
   */
  startNewCycle(cycleData: Pick<CycleDto, 'startDate' | 'bleedingLength'>) {
    const open = this.openCycle();
    if (open && toCycleDay(cycleData.startDate, open.startDate) === null) {
      return throwError(
        () => new Error('A new cycle cannot start before the open one')
      );
    }

    return this.addCycle({
      ...cycleData,
      cycleNumber: (open?.cycleNumber ?? this.cycles().length) + 1,
    });
  }

  addCycle(cycleData: CycleDto) {
    return this.http.post<Cycle>(CycleEndpoints.ADD_CYCLE, cycleData).pipe(
      tap((newCycle) => {
        this.cycles.update((cycles) => [newCycle, ...cycles]);
        this.currentCycleUuid.set(newCycle.uuid);
      })
    );
  }

  updateCycle(cycleUuid: string, cycleData: Partial<CycleDto>) {
    return this.http.put<Cycle>(
      `${CycleEndpoints.UPDATE_CYCLE}${cycleUuid}`,
      cycleData
    );
  }

  deleteCycle(cycleUuid: string) {
    return this.http.delete(`${CycleEndpoints.DELETE_CYCLE}${cycleUuid}`).pipe(
      tap(() => {
        this.cycles.update((cycles) =>
          cycles.filter((c) => c.uuid !== cycleUuid)
        );
        if (this.currentCycleUuid() === cycleUuid) {
          const remaining = this.cycles();
          this.currentCycleUuid.set(
            remaining.length > 0 ? remaining[0].uuid : null
          );
        }
      })
    );
  }

  setCurrentCycle(cycleUuid: string) {
    this.currentCycleUuid.set(cycleUuid);
  }
}
