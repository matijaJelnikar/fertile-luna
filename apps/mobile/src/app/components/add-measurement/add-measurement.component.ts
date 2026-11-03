import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
import { MatCheckbox } from '@angular/material/checkbox';
import {
  BleedingOption,
  CervixFirmnessOption,
  CervixOpennessOption,
  CervixPositionOption,
  IntercourseOption,
  Measurement,
  MeasurementDto,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
  UpdateMeasurementDto,
  DISTURBANCE_REASONS,
  DisturbanceReason,
  hasObservation,
} from '@basal-temp-log-workspace/model';
import { TranslatePipe } from '@ngx-translate/core';
import { toCycleDay } from '../../state/measurements/cycle-day';

export interface MeasurementDialogData {
  mode: 'create' | 'edit';
  measurement: Partial<Measurement>;
  /** Day 1 of the open cycle, so the form can place the chosen date and refuse dates before it. */
  cycleStartDate?: Date | string | null;
  /** The cycle's entries, so choosing a day that already has one opens it rather than duplicating. */
  existingEntries?: readonly Measurement[];
}

/**
 * A day is worth saving when it records something. The method's log has no concept of an entry
 * that observed nothing — that is the same as no entry at all.
 */
const atLeastOneObservation = (group: AbstractControl): ValidationErrors | null =>
  hasObservation(group.value as MeasurementDto) ? null : { noObservation: true };

const sameDay = (a: Date | string, b: Date | string): boolean => {
  const [x, y] = [new Date(a), new Date(b)];
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
};

export interface AddMeasurementFormModel {
  date: FormControl<Date | null>;
  temperature: FormControl<number | null>;
  bleeding: FormControl<BleedingOption | null>;
  pain: FormControl<PainOption | null>;
  mucusFeeling: FormControl<MucusFeelingOption | null>;
  mucusAppearance: FormControl<MucusAppearanceOption | null>;
  cervixPosition: FormControl<CervixPositionOption | null>;
  cervixOpenness: FormControl<CervixOpennessOption | null>;
  cervixFirmness: FormControl<CervixFirmnessOption | null>;
  intercourse: FormControl<IntercourseOption | null>;
  notes: FormControl<string | null>;
  disturbed: FormControl<boolean>;
  disturbanceReasons: FormControl<DisturbanceReason[] | null>;
  disturbanceNote: FormControl<string | null>;
}

@Component({
  selector: 'app-add-measurement',
  templateUrl: './add-measurement.component.html',
  styleUrls: ['./add-measurement.component.scss'],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
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
    MatCheckbox,
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
  cervixOpennessOptions = Object.values(CervixOpennessOption);
  cervixFirmnessOptions = Object.values(CervixFirmnessOption);
  intercourseOptions = Object.values(IntercourseOption);
  disturbanceReasonOptions = DISTURBANCE_REASONS;
  readonly otherReason = DisturbanceReason.Other;

  temperatureForm = new FormGroup<AddMeasurementFormModel>(
    {
      date: new FormControl(null, Validators.required),
      // Not required: a day with a mucus observation and no measurement is a normal day in this
      // method, and the range only means anything once a value is present.
      temperature: new FormControl(null, [Validators.min(30), Validators.max(45)]),
      bleeding: new FormControl(null),
      pain: new FormControl(null),
      mucusFeeling: new FormControl(null),
      mucusAppearance: new FormControl(null),
      cervixPosition: new FormControl(null),
      cervixOpenness: new FormControl(null),
      cervixFirmness: new FormControl(null),
      intercourse: new FormControl(null),
      notes: new FormControl(null),
      disturbed: new FormControl(false, { nonNullable: true }),
      disturbanceReasons: new FormControl<DisturbanceReason[] | null>(null),
      disturbanceNote: new FormControl<string | null>(null),
    },
    { validators: atLeastOneObservation }
  );

  private formValue = toSignal(this.temperatureForm.valueChanges, {
    initialValue: this.temperatureForm.value,
  });

  /** The chosen day's place in the open cycle, or `null` when it cannot be placed. */
  cycleDay = computed(() => {
    const date = this.formValue().date;
    return date ? toCycleDay(date, this.data.cycleStartDate) : null;
  });

  /** A date before day 1 belongs to no cycle, so it is refused rather than silently misplaced. */
  dateOutsideCycle = computed(() => {
    const date = this.formValue().date;
    return !!date && !!this.data.cycleStartDate && this.cycleDay() === null;
  });

  /** A temperature can only be called disturbed if there is one (`#R-DIST-02`). */
  canMarkDisturbed = computed(() => this.formValue().temperature != null);

  showDisturbanceNote = computed(() =>
    (this.formValue().disturbanceReasons ?? []).includes(DisturbanceReason.Other)
  );

  /** Set when the chosen date already had an entry, so the user is told they are editing it. */
  readonly editingExistingDay = signal(false);

  readonly canSave = computed(() => {
    // Read the form signal FIRST. `form.valid` is not reactive, and `&&` would short-circuit
    // before `dateOutsideCycle()` is reached — leaving this computed with no dependency at all,
    // permanently stuck on its first answer.
    this.formValue();
    return this.temperatureForm.valid && !this.dateOutsideCycle();
  });

  private temperatureInput =
    viewChild.required<ElementRef<HTMLInputElement>>('temperatureInput');
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.load(this.data.measurement);

    // Choosing a day that already has an entry opens that entry rather than starting a second one:
    // a duplicate does not raise an error, it shifts every later day's evaluation.
    this.temperatureForm.controls.date.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date) => this.openExistingDay(date));
  }

  private load(measurement: Partial<Measurement>): void {
    const { date, ...rest } = measurement;
    this.temperatureForm.patchValue({
      ...rest,
      // The API serializes the date as a string; the datepicker needs a real Date.
      ...(date ? { date: new Date(date) } : {}),
    });
  }

  private openExistingDay(date: Date | null): void {
    if (this.isEdit || !date) return;

    const existing = (this.data.existingEntries ?? []).find(
      (entry) => sameDay(entry.date, date)
    );
    this.editingExistingDay.set(!!existing);
    if (existing) this.load({ ...existing, date });
  }

  ngAfterViewInit(): void {
    this.temperatureInput().nativeElement.focus();
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.canSave()) return;

    this.dialogRef.close(
      this.isEdit ? this.toUpdatePayload() : this.toCreatePayload()
    );
  }

  /**
   * A day with no temperature is never disturbed, whatever the checkbox last held — the mark says
   * how to read a value, so without one there is nothing to mark.
   */
  private disturbancePayload<T extends undefined | null>(
    empty: T
  ): {
    disturbed: boolean;
    disturbanceReasons: DisturbanceReason[] | T;
    disturbanceNote: string | T;
  } {
    const values = this.temperatureForm.getRawValue();
    if (values.temperature == null || !values.disturbed) {
      return { disturbed: false, disturbanceReasons: empty, disturbanceNote: empty };
    }
    return {
      disturbed: true,
      disturbanceReasons: values.disturbanceReasons?.length
        ? values.disturbanceReasons
        : empty,
      disturbanceNote: (this.showDisturbanceNote() && values.disturbanceNote) || empty,
    };
  }

  private toCreatePayload(): MeasurementDto {
    const values = this.temperatureForm.getRawValue();
    return {
      date: values.date!,
      // Omitted rather than null: on create an absent field means "not recorded", and a day may
      // legitimately carry no measurement at all.
      temperature: values.temperature ?? undefined,
      bleeding: values.bleeding || undefined,
      pain: values.pain || undefined,
      mucusFeeling: values.mucusFeeling || undefined,
      mucusAppearance: values.mucusAppearance || undefined,
      cervixPosition: values.cervixPosition || undefined,
      cervixOpenness: values.cervixOpenness || undefined,
      cervixFirmness: values.cervixFirmness || undefined,
      intercourse: values.intercourse || undefined,
      notes: values.notes || undefined,
      ...this.disturbancePayload(undefined),
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
      cervixOpenness: values.cervixOpenness,
      cervixFirmness: values.cervixFirmness || null,
      intercourse: values.intercourse || null,
      notes: values.notes || null,
      ...this.disturbancePayload(null),
    };
  }
}
