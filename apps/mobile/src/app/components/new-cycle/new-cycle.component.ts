import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CycleDto } from '@basal-temp-log-workspace/model';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';

interface NewCycleFormModel {
  startDate: FormControl<Date>;
  bleedingLength: FormControl<number | null>;
}

export interface NewCycleDialogData {
  /** The open cycle's number and start, so the dialog can say exactly what it is about to close. */
  openCycleNumber?: number | null;
  openCycleStartDate?: Date | string | null;
}

const dayBefore = (date: Date): Date => {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return previous;
};

@Component({
  selector: 'app-new-cycle',
  templateUrl: './new-cycle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [DatePipe, ReactiveFormsModule, MaterialModule, TranslateModule],
})
export class NewCycleComponent {
  readonly dialogRef = inject(MatDialogRef<NewCycleComponent>);
  readonly data = inject<NewCycleDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  form = new FormGroup<NewCycleFormModel>({
    startDate: new FormControl(new Date(), { nonNullable: true, validators: [Validators.required] }),
    bleedingLength: new FormControl(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(14),
    ]),
  });

  private value = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  /**
   * Starting a cycle closes the open one on the day before, in a single operation. The user is
   * told which cycle that is and on what day, because it is not otherwise visible.
   */
  closingCycle = computed(() => {
    const start = this.value().startDate;
    if (!start || !this.data.openCycleStartDate) return null;
    return {
      number: this.data.openCycleNumber ?? null,
      endsOn: dayBefore(new Date(start)),
    };
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
