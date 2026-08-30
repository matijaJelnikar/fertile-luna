import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MeasurementGraphData } from '@basal-temp-log-workspace/model';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AddMeasurementComponent } from '../../components/add-measurement/add-measurement.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { HistoryComponent } from './history.component';
import { HistoryService } from './history.service';

const MEASUREMENTS: MeasurementGraphData[] = [
  { uuid: 'm-1', date: new Date('2026-08-01'), temperature: 36.4, day: 1 },
  { uuid: 'm-2', date: new Date('2026-08-02'), temperature: 36.8, day: 2 },
];

describe('HistoryComponent', () => {
  let fixture: ComponentFixture<HistoryComponent>;
  const historyService = {
    measurements: signal<MeasurementGraphData[]>(MEASUREMENTS),
    updateMeasurement: jest.fn(() => of({})),
    deleteMeasurement: jest.fn(() => of({})),
  };
  const dialog = { open: jest.fn() };

  const openDialogReturning = (result: unknown) =>
    dialog.open.mockReturnValue({ afterClosed: () => of(result) });

  const rowButtons = (row: number) =>
    fixture.nativeElement.querySelectorAll('tbody tr')[row].querySelectorAll(
      'button'
    ) as NodeListOf<HTMLButtonElement>;

  beforeEach(async () => {
    jest.clearAllMocks();
    historyService.measurements.set(MEASUREMENTS);

    await TestBed.configureTestingModule({
      imports: [
        HistoryComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [{ provide: MatDialog, useValue: dialog }],
    })
      .overrideComponent(HistoryComponent, {
        set: { providers: [{ provide: HistoryService, useValue: historyService }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    fixture.detectChanges();
  });

  it('renders a row per measurement with edit and delete actions', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('36.4');
    expect(rowButtons(0)).toHaveLength(2);
  });

  it('saves the dialog result against the row that was edited', () => {
    openDialogReturning({ temperature: 36.6 });

    rowButtons(1)[0].click();

    expect(dialog.open).toHaveBeenCalledWith(
      AddMeasurementComponent,
      expect.objectContaining({
        data: { mode: 'edit', measurement: MEASUREMENTS[1] },
      })
    );
    expect(historyService.updateMeasurement).toHaveBeenCalledWith('m-2', {
      temperature: 36.6,
    });
  });

  it('does not save when the edit dialog is dismissed', () => {
    openDialogReturning(undefined);

    rowButtons(0)[0].click();

    expect(historyService.updateMeasurement).not.toHaveBeenCalled();
  });

  it('deletes only after the confirmation is accepted', () => {
    openDialogReturning(true);

    rowButtons(0)[1].click();

    expect(dialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      expect.anything()
    );
    expect(historyService.deleteMeasurement).toHaveBeenCalledWith('m-1');
  });

  it('keeps the measurement when the confirmation is declined', () => {
    openDialogReturning(false);

    rowButtons(0)[1].click();

    expect(historyService.deleteMeasurement).not.toHaveBeenCalled();
  });

  it('shows an empty state when there is nothing logged', () => {
    historyService.measurements.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.no-data-row')).toBeTruthy();
  });
});
