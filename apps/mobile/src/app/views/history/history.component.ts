import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import {
  MeasurementGraphData,
  UpdateMeasurementDto,
} from '@basal-temp-log-workspace/model';
import { TranslatePipe } from '@ngx-translate/core';
import {
  AddMeasurementComponent,
  MeasurementDialogData,
} from '../../components/add-measurement/add-measurement.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../components/confirm-dialog/confirm-dialog.component';
import { CycleService } from '../../state/measurements/cycle.service';
import { HistoryService } from './history.service';
import { MOBILE_DIALOG_CONFIG } from '../../shared/constants/common.constants';


@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HistoryService],
  imports: [
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatNoDataRow,
    MatRow,
    MatRowDef,
    MatTable,
  ],
})
export class HistoryComponent {
  private dialog = inject(MatDialog);
  private cycleService = inject(CycleService);
  historyService = inject(HistoryService);

  displayedColumns: string[] = ['temperature', 'timestamp', 'actions'];

  editMeasurement(measurement: MeasurementGraphData): void {
    const data: MeasurementDialogData = {
      mode: 'edit',
      measurement,
      cycleStartDate: this.cycleService.currentCycle()?.startDate ?? null,
    };

    this.dialog
      .open(AddMeasurementComponent, { ...MOBILE_DIALOG_CONFIG, data })
      .afterClosed()
      .subscribe((changes: UpdateMeasurementDto | undefined) => {
        if (!changes) return;
        this.historyService
          .updateMeasurement(measurement.uuid, changes)
          .subscribe();
      });
  }

  deleteMeasurement(measurement: MeasurementGraphData): void {
    const data: ConfirmDialogData = {
      titleKey: 'measurement.delete.title',
      messageKey: 'measurement.delete.message',
      // A confirmation that does not say which day it is about is not a confirmation.
      messageParams: {
        date: new Date(measurement.date).toLocaleDateString(),
        day: measurement.day ?? '—',
      },
      confirmKey: 'measurement.delete.confirm',
    };

    this.dialog
      .open(ConfirmDialogComponent, { ...MOBILE_DIALOG_CONFIG, data })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.historyService.deleteMeasurement(measurement.uuid).subscribe();
      });
  }
}
