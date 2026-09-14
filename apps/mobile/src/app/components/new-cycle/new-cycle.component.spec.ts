import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { NewCycleComponent, NewCycleDialogData } from './new-cycle.component';

describe('NewCycleComponent', () => {
  let fixture: ComponentFixture<NewCycleComponent>;
  let component: NewCycleComponent;
  const dialogRef = { close: jest.fn() };

  const setup = async (data: NewCycleDialogData = {}) => {
    dialogRef.close.mockClear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NewCycleComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCycleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('says which cycle closes and on what day', async () => {
    await setup({ openCycleNumber: 3, openCycleStartDate: new Date('2026-08-01') });

    component.form.controls.startDate.setValue(new Date('2026-08-29'));
    fixture.detectChanges();

    const closing = component.closingCycle();
    expect(closing?.number).toBe(3);
    // The open cycle ends the day BEFORE the new one starts, never on the same day.
    expect(closing?.endsOn.toDateString()).toBe(new Date('2026-08-28').toDateString());
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });

  it('says nothing about closing when no cycle is open', async () => {
    await setup({});

    expect(component.closingCycle()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('does not close the dialog while the form is incomplete', async () => {
    await setup({ openCycleStartDate: new Date('2026-08-01') });

    component.save();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('returns only the start date and bleeding length, never a conclusion', async () => {
    await setup({ openCycleStartDate: new Date('2026-08-01') });

    component.form.setValue({
      startDate: new Date('2026-08-29'),
      bleedingLength: 5,
    });
    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith({
      startDate: new Date('2026-08-29'),
      bleedingLength: 5,
    });
  });

  it('changes nothing when cancelled', async () => {
    await setup({ openCycleStartDate: new Date('2026-08-01') });

    component.close();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
