import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  disabled,
  form,
  FormField,
  FormRoot,
  max,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
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
import { skip } from 'rxjs';
import { toCycleDay } from '../../state/measurements/cycle-day';
import { ChipChoiceComponent } from '../chip-choice/chip-choice.component';

export interface MeasurementDialogData {
  mode: 'create' | 'edit';
  measurement: Partial<Measurement>;
  /** Day 1 of the open cycle, so the form can place the chosen date and refuse dates before it. */
  cycleStartDate?: Date | string | null;
  /** The cycle's entries, so choosing a day that already has one opens it rather than duplicating. */
  existingEntries?: readonly Measurement[];
}

/** Text fields hold `''`, never `null`: a text input bound to `null` is parsed as a number. */
export interface MeasurementFormModel {
  date: Date | null;
  temperature: number | null;
  bleeding: BleedingOption | null;
  pain: PainOption | null;
  mucusFeeling: MucusFeelingOption | null;
  mucusAppearance: MucusAppearanceOption | null;
  cervixPosition: CervixPositionOption | null;
  cervixOpenness: CervixOpennessOption | null;
  cervixFirmness: CervixFirmnessOption | null;
  intercourse: IntercourseOption | null;
  notes: string;
  disturbed: boolean;
  disturbanceReasons: DisturbanceReason[];
  disturbanceNote: string;
}

const NO_OBSERVATION = 'noObservation';
const BEFORE_CYCLE = 'beforeCycle';

const sameDay = (a: Date | string, b: Date | string): boolean => {
  const [x, y] = [new Date(a), new Date(b)];
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
};

const sameDayOrBothEmpty = (a: Date | null, b: Date | null): boolean =>
  a === b || (!!a && !!b && sameDay(a, b));

const toFormModel = (measurement: Partial<Measurement>): MeasurementFormModel => ({
  // The API serializes the date as a string; the datepicker needs a real Date.
  date: measurement.date ? new Date(measurement.date) : null,
  temperature: measurement.temperature ?? null,
  bleeding: measurement.bleeding ?? null,
  pain: measurement.pain ?? null,
  mucusFeeling: measurement.mucusFeeling ?? null,
  mucusAppearance: measurement.mucusAppearance ?? null,
  cervixPosition: measurement.cervixPosition ?? null,
  cervixOpenness: measurement.cervixOpenness ?? null,
  cervixFirmness: measurement.cervixFirmness ?? null,
  intercourse: measurement.intercourse ?? null,
  notes: measurement.notes ?? '',
  disturbed: measurement.disturbed ?? false,
  disturbanceReasons: measurement.disturbanceReasons ?? [],
  disturbanceNote: measurement.disturbanceNote ?? '',
});

const isBeforeCycle = (
  date: Date | null,
  cycleStartDate: Date | string | null | undefined
): boolean => !!date && !!cycleStartDate && toCycleDay(date, cycleStartDate) === null;

/**
 * A day with no temperature is never disturbed, whatever the checkbox last held — the mark says
 * how to read a value, so without one there is nothing to mark.
 */
const toDisturbancePayload = <T extends undefined | null>(
  values: MeasurementFormModel,
  empty: T
): {
  disturbed: boolean;
  disturbanceReasons: DisturbanceReason[] | T;
  disturbanceNote: string | T;
} => {
  if (values.temperature == null || !values.disturbed) {
    return { disturbed: false, disturbanceReasons: empty, disturbanceNote: empty };
  }
  const reasons = values.disturbanceReasons ?? [];
  return {
    disturbed: true,
    disturbanceReasons: reasons.length ? reasons : empty,
    disturbanceNote:
      (reasons.includes(DisturbanceReason.Other) && values.disturbanceNote) || empty,
  };
};

const toCreatePayload = (values: MeasurementFormModel): MeasurementDto => ({
  date: values.date as Date,
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
  ...toDisturbancePayload(values, undefined),
});

// An edit sends `null` rather than `undefined` for empty fields, so clearing a
// previously recorded observation actually reaches the server.
const toUpdatePayload = (values: MeasurementFormModel): UpdateMeasurementDto => ({
  date: values.date as Date,
  temperature: values.temperature as number,
  bleeding: values.bleeding || null,
  pain: values.pain || null,
  mucusFeeling: values.mucusFeeling || null,
  mucusAppearance: values.mucusAppearance || null,
  cervixPosition: values.cervixPosition || null,
  cervixOpenness: values.cervixOpenness || null,
  cervixFirmness: values.cervixFirmness || null,
  intercourse: values.intercourse || null,
  notes: values.notes || null,
  ...toDisturbancePayload(values, null),
});

@Component({
  selector: 'app-add-measurement',
  templateUrl: './add-measurement.component.html',
  styleUrls: ['./add-measurement.component.scss'],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ChipChoiceComponent,
    FormField,
    FormRoot,
    TranslatePipe,
    MatButton,
    MatCheckbox,
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
export class AddMeasurementComponent implements AfterViewInit {
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

  private measurement = signal(toFormModel(this.data.measurement));

  temperatureForm = form(
    this.measurement,
    (path) => {
      required(path.date);
      // A date before day 1 belongs to no cycle, so it is refused rather than silently misplaced.
      validate(path.date, ({ value }) =>
        isBeforeCycle(value(), this.data.cycleStartDate) ? { kind: BEFORE_CYCLE } : null
      );
      // Not required: a day with a mucus observation and no measurement is a normal day in this
      // method, and the range only means anything once a value is present.
      min(path.temperature, 30);
      max(path.temperature, 45);
      // A temperature can only be called disturbed if there is one (`#R-DIST-02`).
      disabled(path.disturbed, ({ valueOf }) => valueOf(path.temperature) == null);
      // The method's log has no concept of an entry that observed nothing.
      validate(path, ({ value }) =>
        hasObservation(toCreatePayload(value())) ? null : { kind: NO_OBSERVATION }
      );
    },
    { submission: { action: async () => this.save() } }
  );

  /** The chosen day's place in the open cycle, or `null` when it cannot be placed. */
  cycleDay = computed(() => {
    const date = this.measurement().date;
    return date ? toCycleDay(date, this.data.cycleStartDate) : null;
  });

  dateOutsideCycle = computed(() =>
    this.temperatureForm
      .date()
      .errors()
      .some((error) => error.kind === BEFORE_CYCLE)
  );

  canMarkDisturbed = computed(() => !this.temperatureForm.disturbed().disabled());

  showDisturbanceReasons = computed(
    () => this.canMarkDisturbed() && this.measurement().disturbed
  );

  showDisturbanceNote = computed(() =>
    this.measurement().disturbanceReasons.includes(DisturbanceReason.Other)
  );

  nothingRecorded = computed(
    () =>
      this.temperatureForm().touched() &&
      this.temperatureForm()
        .errors()
        .some((error) => error.kind === NO_OBSERVATION)
  );

  /** Set when the chosen date already had an entry, so the user is told they are editing it. */
  readonly editingExistingDay = signal(false);

  readonly canSave = computed(() => this.temperatureForm().valid());

  private chosenDate = computed(() => this.measurement().date, {
    equal: sameDayOrBothEmpty,
  });

  private temperatureInput =
    viewChild.required<ElementRef<HTMLInputElement>>('temperatureInput');

  constructor() {
    // Choosing a day that already has an entry opens that entry rather than starting a second one:
    // a duplicate does not raise an error, it shifts every later day's evaluation.
    toObservable(this.chosenDate)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((date) => this.openExistingDay(date));
  }

  private openExistingDay(date: Date | null): void {
    if (this.isEdit || !date) return;

    const existing = (this.data.existingEntries ?? []).find((entry) =>
      sameDay(entry.date, date)
    );
    this.editingExistingDay.set(!!existing);
    if (existing) this.measurement.set({ ...toFormModel(existing), date });
  }

  ngAfterViewInit(): void {
    this.temperatureInput().nativeElement.focus();
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.canSave()) return;

    const values = this.measurement();
    this.dialogRef.close(
      this.isEdit ? toUpdatePayload(values) : toCreatePayload(values)
    );
  }
}
