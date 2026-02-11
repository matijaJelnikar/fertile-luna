import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Cycle, CycleDto } from '@basal-temp-log-workspace/model';
import { tap } from 'rxjs';
import { CycleEndpoints } from '../../shared/constants/endpoints.constants';

@Injectable({ providedIn: 'root' })
export class CycleService {
  cycles = signal<Cycle[]>([]);
  currentCycleUuid = signal<string | null>(null);

  currentCycle = computed(() => {
    const cycleUuid = this.currentCycleUuid();
    if (!cycleUuid) return null;
    return this.cycles().find((cycle) => cycle.uuid === cycleUuid) || null;
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
