import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  form,
  FormField,
  FormRoot,
  max,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
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
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { CycleDto } from '@basal-temp-log-workspace/model';
import { TranslatePipe } from '@ngx-translate/core';
import { toCycleDay } from '../../state/measurements/cycle-day';

interface NewCycleModel {
  startDate: Date | null;
  bleedingLength: number | null;
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

const NOT_AFTER_OPEN_CYCLE = 'notAfterOpenCycle';

/** A new cycle must begin after the open cycle's first day, or the open one would have no days. */
const startsAfter = (
  date: Date | null,
  openCycleStart: Date | string | null | undefined
): boolean => {
  if (!openCycleStart || !date) return true;
  const day = toCycleDay(date, openCycleStart);
  return day !== null && day > 1;
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
  imports: [
    DatePipe,
    FormField,
    FormRoot,
    TranslatePipe,
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    MatSuffix,
  ],
})
export class NewCycleComponent {
  readonly dialogRef = inject(MatDialogRef<NewCycleComponent>);
  readonly data = inject<NewCycleDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  private cycle = signal<NewCycleModel>({
    startDate: this.data.suggestedStartDate ?? new Date(),
    bleedingLength: null,
  });

  cycleForm = form(
    this.cycle,
    (path) => {
      required(path.startDate);
      validate(path.startDate, ({ value }) =>
        startsAfter(value(), this.data.openCycleStartDate)
          ? null
          : { kind: NOT_AFTER_OPEN_CYCLE }
      );
      required(path.bleedingLength);
      min(path.bleedingLength, 1);
      max(path.bleedingLength, 14);
    },
    { submission: { action: async () => this.save() } }
  );

  startsTooEarly = computed(() =>
    this.cycleForm
      .startDate()
      .errors()
      .some((error) => error.kind === NOT_AFTER_OPEN_CYCLE)
  );

  /**
   * Starting a cycle closes the open one on the day before, in a single operation. The user is
   * told which cycle that is and on what day, because it is not otherwise visible.
   */
  closingCycle = computed(() => {
    const start = this.cycle().startDate;
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
    if (this.cycleForm().invalid()) return;
    const { startDate, bleedingLength } = this.cycle();
    const payload: NewCyclePayload = {
      startDate: startDate as Date,
      bleedingLength: bleedingLength as number,
    };
    this.dialogRef.close(payload);
  }
}
