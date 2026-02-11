import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CycleDto } from '@basal-temp-log-workspace/model';
import { MaterialModule } from '../../material.module';

interface NewCycleFormModel {
  startDate: FormControl<Date>;
  bleedingLength: FormControl<number | null>;
}

@Component({
  selector: 'app-new-cycle',
  templateUrl: './new-cycle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [ReactiveFormsModule, MaterialModule],
})
export class NewCycleComponent {
  readonly dialogRef = inject(MatDialogRef<NewCycleComponent>);

  form = new FormGroup<NewCycleFormModel>({
    startDate: new FormControl(new Date(), { nonNullable: true, validators: [Validators.required] }),
    bleedingLength: new FormControl(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(14),
    ]),
  });

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) return;
    const { startDate, bleedingLength } = this.form.getRawValue();
    const payload: Pick<CycleDto, 'startDate' | 'bleedingLength'> = {
      startDate,
      bleedingLength: bleedingLength!,
    };
    this.dialogRef.close(payload);
  }
}
