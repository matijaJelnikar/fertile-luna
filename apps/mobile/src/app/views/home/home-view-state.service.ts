import { Injectable, signal } from '@angular/core';

interface PerCycle<T> {
  readonly cycleUuid: string;
  readonly value: T;
}

/** What the home screen was showing, kept in root so it outlives a visit to another page. */
@Injectable({ providedIn: 'root' })
export class HomeViewStateService {
  private day = signal<PerCycle<number> | null>(null);
  private chartScroll: PerCycle<number> | null = null;

  /** The day chosen in that cycle, or `null` when none was. */
  dayIn(cycleUuid: string | null): number | null {
    const selection = this.day();
    return selection?.cycleUuid === cycleUuid ? selection.value : null;
  }

  selectDay(cycleUuid: string, day: number): void {
    this.day.set({ cycleUuid, value: day });
  }

  /** Read once when the sheet is drawn, so it is not a signal. */
  chartScrollIn(cycleUuid: string | null): number | null {
    return this.chartScroll?.cycleUuid === cycleUuid
      ? this.chartScroll.value
      : null;
  }

  saveChartScroll(cycleUuid: string, left: number): void {
    this.chartScroll = { cycleUuid, value: left };
  }
}
