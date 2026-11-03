import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  BleedingOption,
  DisturbanceReason,
  Measurement,
  MucusFeelingOption,
} from '@basal-temp-log-workspace/model';
import { provideTranslateService } from '@ngx-translate/core';
import {
  AddMeasurementComponent,
  MeasurementDialogData,
  MeasurementFormModel,
} from './add-measurement.component';

const EXISTING: Measurement = {
  uuid: 'measurement-1',
  // The API serializes dates as strings — the component must cope with that.
  date: '2026-08-12T00:00:00.000Z' as unknown as Date,
  temperature: 36.7,
  bleeding: BleedingOption.Medium,
  mucusFeeling: MucusFeelingOption.Dry,
  notes: 'slept badly',
};

describe('AddMeasurementComponent', () => {
  let fixture: ComponentFixture<AddMeasurementComponent>;
  let component: AddMeasurementComponent;
  const dialogRef = { close: jest.fn() };

  const setup = async (data: MeasurementDialogData) => {
    dialogRef.close.mockClear();

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        AddMeasurementComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideTranslateService(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddMeasurementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // MatChipListbox applies the written value in a microtask after content init.
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const patch = (values: Partial<MeasurementFormModel>) =>
    component.temperatureForm().value.update((current) => ({ ...current, ...values }));

  it('pre-fills the form from the measurement being edited', async () => {
    await setup({ mode: 'edit', measurement: EXISTING });

    const value = component.temperatureForm().value();
    expect(value.temperature).toBe(36.7);
    expect(value.bleeding).toBe(BleedingOption.Medium);
    expect(value.mucusFeeling).toBe(MucusFeelingOption.Dry);
    expect(value.notes).toBe('slept badly');
    expect(value.date).toBeInstanceOf(Date);
  });

  it('selects the chip matching an existing value', async () => {
    await setup({ mode: 'edit', measurement: EXISTING });

    const selected = fixture.nativeElement.querySelectorAll(
      'mat-chip-option.mat-mdc-chip-selected'
    );
    expect(
      Array.from(selected, (chip) => (chip as HTMLElement).textContent?.trim())
    ).toEqual([BleedingOption.Medium, MucusFeelingOption.Dry]);
  });

  it('closes with null for a cleared field so the edit can unset it', async () => {
    await setup({ mode: 'edit', measurement: EXISTING });

    // Deselecting a chip is what a user does to clear an observation.
    const selectedChip = fixture.nativeElement.querySelector(
      'mat-chip-option.mat-mdc-chip-selected [role="option"]'
    ) as HTMLElement;
    selectedChip.click();
    fixture.detectChanges();
    component.temperatureForm.notes().value.set(null);
    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 36.7,
        bleeding: null,
        notes: null,
        mucusFeeling: MucusFeelingOption.Dry,
      })
    );
  });

  it('closes with undefined for empty fields when creating', async () => {
    await setup({ mode: 'create', measurement: { date: new Date() } });

    component.temperatureForm.temperature().value.set(36.5);
    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 36.5, bleeding: undefined })
    );
  });

  it('does not close while the form is invalid', async () => {
    await setup({ mode: 'create', measurement: { date: new Date() } });

    component.save();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  describe('a day without a temperature', () => {
    it('saves when it records an observation', async () => {
      await setup({ mode: 'create', measurement: { date: new Date() } });

      component.temperatureForm.mucusFeeling().value.set(
        MucusFeelingOption.Wet
      );
      component.save();

      expect(dialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: undefined,
          mucusFeeling: MucusFeelingOption.Wet,
        })
      );
    });

    it('is rejected when it records nothing at all', async () => {
      await setup({ mode: 'create', measurement: { date: new Date() } });

      expect(component.canSave()).toBe(false);
      component.save();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('explains why once the user has tried to save', async () => {
      await setup({ mode: 'create', measurement: { date: new Date() } });
      expect(fixture.nativeElement.textContent).not.toContain('measurement.nothing.recorded');

      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('measurement.nothing.recorded');
    });

    it('still rejects a temperature outside the range when one is given', async () => {
      await setup({ mode: 'create', measurement: { date: new Date() } });

      component.temperatureForm.temperature().value.set(12);
      component.save();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('the disturbance mark', () => {
    const disturbedDay = async () => {
      await setup({ mode: 'create', measurement: { date: new Date() } });
      patch({ temperature: 37.1, disturbed: true });
      fixture.detectChanges();
    };

    it('cannot be set on a day with no temperature', async () => {
      await setup({ mode: 'create', measurement: { date: new Date() } });

      expect(component.canMarkDisturbed()).toBe(false);

      // Even if the flag is somehow set, a day without a value is never sent as disturbed.
      patch({
        disturbed: true,
        mucusFeeling: MucusFeelingOption.Wet,
      });
      component.save();

      expect(dialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({ disturbed: false })
      );
    });

    it('sends the mark and its reasons, keeping the measured value', async () => {
      await disturbedDay();
      component.temperatureForm.disturbanceReasons().value.set([
        DisturbanceReason.PoorSleep,
      ]);

      component.save();

      expect(dialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 37.1,
          disturbed: true,
          disturbanceReasons: [DisturbanceReason.PoorSleep],
        })
      );
    });

    it('carries free text beside Other, and only then', async () => {
      await disturbedDay();
      patch({
        disturbanceReasons: [DisturbanceReason.Other],
        disturbanceNote: 'karneval',
      });
      fixture.detectChanges();

      expect(component.showDisturbanceNote()).toBe(true);
      component.save();

      expect(dialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({ disturbanceNote: 'karneval' })
      );
    });

    it('unmarks without touching the value', async () => {
      await disturbedDay();
      patch({ disturbed: false });

      component.save();

      expect(dialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 37.1,
          disturbed: false,
          disturbanceReasons: undefined,
        })
      );
    });
  });

  describe('placing the day in its cycle', () => {
    const CYCLE_START = new Date('2026-08-01');

    it('shows which cycle day the chosen date falls on', async () => {
      await setup({
        mode: 'create',
        measurement: { date: new Date('2026-08-05') },
        cycleStartDate: CYCLE_START,
      });

      expect(component.cycleDay()).toBe(5);

      component.temperatureForm.date().value.set(new Date('2026-08-10'));
      expect(component.cycleDay()).toBe(10);
    });

    it('refuses a date before the cycle began, and explains why', async () => {
      await setup({
        mode: 'create',
        measurement: { date: new Date('2026-07-28') },
        cycleStartDate: CYCLE_START,
      });
      component.temperatureForm.temperature().value.set(36.5);
      fixture.detectChanges();

      expect(component.dateOutsideCycle()).toBe(true);
      expect(component.canSave()).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();

      component.save();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('a day that already has an entry', () => {
    it('opens that entry for editing, and says so', async () => {
      await setup({
        mode: 'create',
        measurement: { date: new Date('2026-08-11') },
        cycleStartDate: new Date('2026-08-01'),
        existingEntries: [EXISTING],
      });

      component.temperatureForm.date().value.set(new Date(EXISTING.date));
      fixture.detectChanges();

      expect(component.editingExistingDay()).toBe(true);
      expect(component.temperatureForm().value().temperature).toBe(36.7);
      expect(fixture.nativeElement.textContent).toContain(
        'measurement.editing.existing'
      );
    });

    it('leaves a day with no entry alone', async () => {
      await setup({
        mode: 'create',
        measurement: { date: new Date('2026-08-11') },
        existingEntries: [EXISTING],
      });

      expect(component.editingExistingDay()).toBe(false);
    });
  });
});
