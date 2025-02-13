import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { CycleDto } from '@basal-temp-log-workspace/model';
import { tap } from 'rxjs';
import { CycleEndpoints } from '../../shared/constants/endpoints.constants';

@Injectable({ providedIn: 'root' })
export class CycleService {
  cycles = signal<CycleDto[]>([]);

  constructor(private http: HttpClient) {}

  addCycle(cycleData: CycleDto) {
    return this.http.post<CycleDto>(CycleEndpoints.ADD_CYCLE, cycleData).pipe(
      tap((newCycle) => {
        this.cycles.update((cycles) => {
          return [...cycles, newCycle];
        });
      })
    );
  }
}
