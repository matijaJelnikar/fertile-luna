import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CycleDto } from '@basal-temp-log-workspace/model';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';
import { toCycleDay } from '../../state/measurements/cycle-day';

interface NewCycleFormModel {
  startDate: FormControl<Date>;
  bleedingLength: FormControl<number | null>;
}

/** What the dialog returns when confirmed: only what is known on the day a cycle starts. */
export type NewCyclePayload = Pick<CycleDto, 'startDate' | 'bleedingLength'>;

export interface NewCycleDialogData {
  /** The open cycle's number and start, so the dialog can say exactly what it is about to close. */
  openCycleNumber?: number | null;
  openCycleStartDate?: Date | string | null;
  /**
   * Prefills the start date. Set when the dialog is offered because menstrual bleeding was recorded
   * on that day — the user still confirms, since bleeding mid-cycle looks the same.
   */
  suggestedStartDate?: Date | null;
}

/** A new cycle must begin after the open cycle's first day, or the open one would have no days. */
const startsAfter =
  (openCycleStart: Date | string | null | undefined): ValidatorFn =>
  (control) => {
    if (!openCycleStart || !control.value) return null;
    const day = toCycleDay(control.value, openCycleStart);
    return day !== null && day > 1 ? null : { notAfterOpenCycle: true };
  };

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
  imports: [DatePipe, ReactiveFormsModule, MaterialModule, TranslatePipe],
})
export class NewCycleComponent {
  readonly dialogRef = inject(MatDialogRef<NewCycleComponent>);
  readonly data = inject<NewCycleDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  form = new FormGroup<NewCycleFormModel>({
    startDate: new FormControl(this.data.suggestedStartDate ?? new Date(), {
      nonNullable: true,
      validators: [Validators.required, startsAfter(this.data.openCycleStartDate)],
    }),
    bleedingLength: new FormControl(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(14),
    ]),
  });

  private value = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  /** Read through the value signal: `hasError` alone is not reactive. */
  startsTooEarly = computed(() => {
    this.value();
    return this.form.controls.startDate.hasError('notAfterOpenCycle');
  });

  /**
   * Starting a cycle closes the open one on the day before, in a single operation. The user is
   * told which cycle that is and on what day, because it is not otherwise visible.
   */
  closingCycle = computed(() => {
    const start = this.value().startDate;
    if (!start || !this.data.openCycleStartDate || this.startsTooEarly()) return null;
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
    const payload: NewCyclePayload = {
      startDate,
      bleedingLength: bleedingLength as number,
    };
    this.dialogRef.close(payload);
  }
}
