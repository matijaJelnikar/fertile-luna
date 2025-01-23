import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AddMeasurementModel,
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '@basal-temp-log-workspace/model';
import { MaterialModule } from '../../material.module';

export interface AddMeasurementFormModel {
  date: FormControl<Date>;
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
  standalone: true,
  selector: 'app-add-measurement',
  templateUrl: './add-measurement.component.html',
  styleUrls: ['./add-measurement.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
})
export class AddMeasurementComponent implements OnInit, AfterViewInit {
  readonly dialogRef = inject(MatDialogRef<AddMeasurementComponent>);
  readonly data = inject<AddMeasurementModel>(MAT_DIALOG_DATA);

  isLoading = true;
  bleedingOptions = Object.values(BleedingOption);
  painOptions = Object.values(PainOption);
  mucusFeelingOptions = Object.values(MucusFeelingOption);
  mucusAppearanceOptions = Object.values(MucusAppearanceOption);
  cervixPositionOptions = Object.values(CervixPositionOption);
  cervixFeelingOptions = Object.values(CervixFeelingOption);
  intercourseOptions = Object.values(IntercourseOption);

  temperatureForm = new FormGroup<AddMeasurementFormModel>({
    date: new FormControl(),
    temperature: new FormControl(null, Validators.required),
    bleeding: new FormControl(null),
    pain: new FormControl(null),
    mucusFeeling: new FormControl(null),
    mucusAppearance: new FormControl(null),
    cervixPosition: new FormControl(null),
    cervixFeeling: new FormControl(null),
    intercourse: new FormControl(null),
    notes: new FormControl(null),
  });

  @ViewChild('temperatureInput') temperatureInput!: ElementRef;

  ngOnInit() {
    this.temperatureForm.patchValue({ ...this.data });
  }

  ngAfterViewInit(): void {
    this.temperatureInput.nativeElement.focus();
  }

  addTemperature(): void {}

  close(): void {
    this.dialogRef.close();
  }

  save(): void {}
}
