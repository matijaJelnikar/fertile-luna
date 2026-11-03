import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Cycle } from '@basal-temp-log-workspace/model';
import { Observable, of, switchMap } from 'rxjs';
import { CycleService } from '../../state/measurements/cycle.service';
import {
  NewCycleComponent,
  NewCycleDialogData,
  NewCyclePayload,
} from './new-cycle.component';

/** The one way a cycle is started, from wherever it is offered. */
@Injectable({ providedIn: 'root' })
export class NewCycleDialogService {
  private dialog = inject(MatDialog);
  private cycleService = inject(CycleService);

  /**
   * Asks for the new cycle's start and, when confirmed, starts it — closing the open cycle in the
   * same operation. Emits the new cycle, or `null` when the dialog is dismissed.
   */
  start(suggestedStartDate: Date | null = null): Observable<Cycle | null> {
    const open = this.cycleService.openCycle();

    return this.dialog
      .open<NewCycleComponent, NewCycleDialogData, NewCyclePayload>(NewCycleComponent, {
        data: {
          openCycleNumber: open?.cycleNumber ?? null,
          openCycleStartDate: open?.startDate ?? null,
          suggestedStartDate,
        },
        width: '90%',
        maxWidth: '95vw',
        height: 'auto',
        maxHeight: '95vh',
        panelClass: 'mobile-dialog',
        autoFocus: false,
      })
      .afterClosed()
      .pipe(
        switchMap((payload) => (payload ? this.cycleService.startNewCycle(payload) : of(null)))
      );
  }
}
