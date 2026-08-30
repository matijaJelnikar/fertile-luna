import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  BleedingOption,
  Measurement,
  MucusFeelingOption,
} from '@basal-temp-log-workspace/model';
import { TranslateModule } from '@ngx-translate/core';
import {
  AddMeasurementComponent,
  MeasurementDialogData,
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
        TranslateModule.forRoot(),
      ],
      providers: [
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

  it('pre-fills the form from the measurement being edited', async () => {
    await setup({ mode: 'edit', measurement: EXISTING });

    const value = component.temperatureForm.getRawValue();
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
    component.temperatureForm.controls.notes.setValue(null);
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

    component.temperatureForm.controls.temperature.setValue(36.5);
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
});
