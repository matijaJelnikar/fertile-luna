import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

import { NewCycleComponent, NewCycleDialogData } from './new-cycle.component';

describe('NewCycleComponent', () => {
  let fixture: ComponentFixture<NewCycleComponent>;
  let component: NewCycleComponent;
  const dialogRef = { close: jest.fn() };

  const setup = async (data: NewCycleDialogData = {}) => {
    dialogRef.close.mockClear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NewCycleComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
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

    component.cycleForm.startDate().value.set(new Date('2026-08-29'));
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

    component.cycleForm().value.set({
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

  it('refuses a start on or before the open cycle`s first day, which would leave it no days', async () => {
    await setup({ openCycleStartDate: new Date(2026, 7, 1) });

    component.cycleForm().value.set({ startDate: new Date(2026, 7, 1), bleedingLength: 5 });
    fixture.detectChanges();
    component.save();

    expect(component.startsTooEarly()).toBe(true);
    expect(component.closingCycle()).toBeNull();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  describe('when offered because bleeding was recorded', () => {
    const offered: NewCycleDialogData = {
      openCycleNumber: 3,
      openCycleStartDate: new Date(2026, 7, 1),
      suggestedStartDate: new Date(2026, 7, 29),
    };

    it('starts from the day the bleeding was recorded', async () => {
      await setup(offered);

      expect(component.cycleForm.startDate().value()).toEqual(new Date(2026, 7, 29));
      expect(fixture.nativeElement.querySelector('.offer-note')).toBeTruthy();
    });

    it('says why it is asking, and declining keeps the day where it was', async () => {
      await setup(offered);

      const [decline] = fixture.nativeElement.querySelectorAll('mat-dialog-actions button');
      expect(decline.textContent.trim()).toBe('cycle.new.decline');

      decline.click();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });
  });

  it('asks nothing about bleeding when opened by hand', async () => {
    await setup({ openCycleStartDate: new Date(2026, 7, 1) });

    expect(fixture.nativeElement.querySelector('.offer-note')).toBeNull();
  });
});
