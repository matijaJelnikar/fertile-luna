import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Cycle, CycleWithDerived } from '@basal-temp-log-workspace/model';
import { of } from 'rxjs';
import { CycleService } from '../../state/measurements/cycle.service';
import { NewCycleDialogService } from './new-cycle-dialog.service';
import { NewCycleComponent } from './new-cycle.component';

describe('NewCycleDialogService', () => {
  let service: NewCycleDialogService;

  const dialog = { open: jest.fn() };
  const openCycle = signal<CycleWithDerived | null>(null);
  const cycleService = { openCycle, startNewCycle: jest.fn() };

  const payload = { startDate: new Date(2026, 7, 29), bleedingLength: 5 };

  beforeEach(() => {
    jest.clearAllMocks();
    openCycle.set({
      uuid: 'c3',
      cycleNumber: 3,
      startDate: new Date(2026, 7, 1),
      bleedingLength: 5,
      isOpen: true,
      endDate: null,
      length: null,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: CycleService, useValue: cycleService },
      ],
    });
    service = TestBed.inject(NewCycleDialogService);
  });

  it('asks about the open cycle and starts what the dialog returns', () => {
    const created = { uuid: 'c4', cycleNumber: 4, ...payload } as Cycle;
    dialog.open.mockReturnValue({ afterClosed: () => of(payload) });
    cycleService.startNewCycle.mockReturnValue(of(created));

    let emitted: Cycle | null | undefined;
    service.start(new Date(2026, 7, 29)).subscribe((cycle) => (emitted = cycle));

    expect(dialog.open).toHaveBeenCalledWith(
      NewCycleComponent,
      expect.objectContaining({
        data: {
          openCycleNumber: 3,
          openCycleStartDate: new Date(2026, 7, 1),
          suggestedStartDate: new Date(2026, 7, 29),
        },
      })
    );
    expect(cycleService.startNewCycle).toHaveBeenCalledWith(payload);
    expect(emitted).toBe(created);
  });

  it('starts nothing, and says so, when the dialog is dismissed', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    let emitted: Cycle | null | undefined;
    service.start().subscribe((cycle) => (emitted = cycle));

    expect(cycleService.startNewCycle).not.toHaveBeenCalled();
    expect(emitted).toBeNull();
  });
});
