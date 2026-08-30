import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {
  MatFormField,
  MatHint,
  MatLabel,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
  Measurement,
  MeasurementDto,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
  UpdateMeasurementDto,
} from '@basal-temp-log-workspace/model';
import { TranslateModule } from '@ngx-translate/core';

export interface MeasurementDialogData {
  mode: 'create' | 'edit';
  measurement: Partial<Measurement>;
}

export interface AddMeasurementFormModel {
  date: FormControl<Date | null>;
  temperature: FormControl<number | null>;
  bleeding: FormControl<BleedingOption | null>;
  pain: FormControl<PainOption | null>;
  mucusFeeling: FormControl<MucusFeelingOption | null>;
  mucusAppearance: FormControl<MucusAppearanceOption | null>;
  cervixPosition: FormControl<CervixPositionOption | null>;
  cervixFeeling: FormControl<CervixFeelingOption | null>;
  intercourse: FormControl<IntercourseOption | null>;
  notes: FormControl<string | null>;
}

@Component({
  selector: 'app-add-measurement',
  templateUrl: './add-measurement.component.html',
  styleUrls: ['./add-measurement.component.scss'],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatButton,
    MatChipListbox,
    MatChipOption,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
  ],
})
export class AddMeasurementComponent implements OnInit, AfterViewInit {
  readonly dialogRef = inject(MatDialogRef<AddMeasurementComponent>);
  readonly data = inject<MeasurementDialogData>(MAT_DIALOG_DATA);
  readonly isEdit = this.data.mode === 'edit';

  bleedingOptions = Object.values(BleedingOption);
  painOptions = Object.values(PainOption);
  mucusFeelingOptions = Object.values(MucusFeelingOption);
  mucusAppearanceOptions = Object.values(MucusAppearanceOption);
  cervixPositionOptions = Object.values(CervixPositionOption);
  cervixFeelingOptions = Object.values(CervixFeelingOption);
  intercourseOptions = Object.values(IntercourseOption);

  temperatureForm = new FormGroup<AddMeasurementFormModel>({
    date: new FormControl(null, Validators.required),
    temperature: new FormControl(null, [
      Validators.required,
      Validators.min(30),
      Validators.max(45),
    ]),
    bleeding: new FormControl(null),
    pain: new FormControl(null),
    mucusFeeling: new FormControl(null),
    mucusAppearance: new FormControl(null),
    cervixPosition: new FormControl(null),
    cervixFeeling: new FormControl(null),
    intercourse: new FormControl(null),
    notes: new FormControl(null),
  });

  private temperatureInput =
    viewChild.required<ElementRef<HTMLInputElement>>('temperatureInput');

  ngOnInit() {
    const { date, ...rest } = this.data.measurement;
    this.temperatureForm.patchValue({
      ...rest,
      // The API serializes the date as a string; the datepicker needs a real Date.
      ...(date ? { date: new Date(date) } : {}),
    });
  }

  ngAfterViewInit(): void {
    this.temperatureInput().nativeElement.focus();
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.temperatureForm.invalid) return;

    this.dialogRef.close(
      this.isEdit ? this.toUpdatePayload() : this.toCreatePayload()
    );
  }

  private toCreatePayload(): MeasurementDto {
    const values = this.temperatureForm.getRawValue();
    return {
      date: values.date!,
      temperature: values.temperature!,
      bleeding: values.bleeding || undefined,
      pain: values.pain || undefined,
      mucusFeeling: values.mucusFeeling || undefined,
      mucusAppearance: values.mucusAppearance || undefined,
      cervixPosition: values.cervixPosition || undefined,
      cervixFeeling: values.cervixFeeling || undefined,
      intercourse: values.intercourse || undefined,
      notes: values.notes || undefined,
    };
  }

  // An edit sends `null` rather than `undefined` for empty fields, so clearing a
  // previously recorded observation actually reaches the server.
  private toUpdatePayload(): UpdateMeasurementDto {
    const values = this.temperatureForm.getRawValue();
    return {
      date: values.date!,
      temperature: values.temperature!,
      bleeding: values.bleeding || null,
      pain: values.pain || null,
      mucusFeeling: values.mucusFeeling || null,
      mucusAppearance: values.mucusAppearance || null,
      cervixPosition: values.cervixPosition || null,
      cervixFeeling: values.cervixFeeling || null,
      intercourse: values.intercourse || null,
      notes: values.notes || null,
    };
  }
}
