import { DatePipe } from '@angular/common';
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
import { TranslateModule } from '@ngx-translate/core';
import {
  AddMeasurementComponent,
  MeasurementDialogData,
} from '../../components/add-measurement/add-measurement.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../components/confirm-dialog/confirm-dialog.component';
import { HistoryService } from './history.service';

const MOBILE_DIALOG_CONFIG = {
  width: '90%',
  maxWidth: '95vw',
  height: 'auto',
  maxHeight: '95vh',
  panelClass: 'mobile-dialog',
  autoFocus: false,
};

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HistoryService],
  imports: [
    DatePipe,
    TranslateModule,
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
  historyService = inject(HistoryService);

  displayedColumns: string[] = ['temperature', 'timestamp', 'actions'];

  editMeasurement(measurement: MeasurementGraphData): void {
    const data: MeasurementDialogData = { mode: 'edit', measurement };

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
