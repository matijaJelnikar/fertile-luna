import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '@basal-temp-log-workspace/model';
import { MaterialModule } from '../../material.module';

export interface DialogData {}

@Component({
  standalone: true,
  selector: 'app-add-measurement',
  templateUrl: './add-measurement.component.html',
  styleUrls: ['./add-measurement.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
})
export class AddMeasurementComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<AddMeasurementComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  // readonly animal = model(this.data.animal);

  isLoading = true;
  bleedingOptions = Object.values(BleedingOption);
  painOptions = Object.values(PainOption);
  mucusFeelingOptions = Object.values(MucusFeelingOption);
  mucusAppearanceOptions = Object.values(MucusAppearanceOption);
  cervixPositionOptions = Object.values(CervixPositionOption);
  cervixFeelingOptions = Object.values(CervixFeelingOption);
  intercourseOptions = Object.values(IntercourseOption);

  temperatureForm: FormGroup<any> = new FormGroup({
    temperature: new FormControl(null),
    bleeding: new FormControl('Light', Validators.required),
    pain: new FormControl(null),
    mucusFeeling: new FormControl(null),
    mucusAppearance: new FormControl(null),
    cervixPosition: new FormControl(null),
    cervixFeeling: new FormControl(null),
    intercourse: new FormControl(null),
    notes: new FormControl(''),
  });

  ngOnInit() {}

  addTemperature(): void {}

  close(): void {
    this.dialogRef.close();
  }

  save(): void {}
}
