import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  CycleEvaluation,
  CycleGoal,
  DayPhase,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { TranslatePipe } from '@ngx-translate/core';

interface MarkerChip {
  /** Which sign the mark belongs to, so the chip says whether it is mucus or temperature. */
  readonly signKey: string;
  readonly labelKey: string;
}

interface Observation {
  readonly labelKey: string;
  readonly value: string;
}

/** The day selected on the sheet, written out in full, with the way to change it. */
@Component({
  selector: 'app-day-card',
  imports: [DatePipe, MatIconButton, MatIcon, TranslatePipe],
  templateUrl: './day-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DayCardComponent {
  day = input.required<number>();
  /** The day's entry, or `null` when nothing was recorded on it. */
  entry = input<MeasurementGraphData | null>(null);
  evaluation = input<CycleEvaluation | null>(null);
  cycleStartDate = input<Date | string | null>(null);

  /** The method's phase on the day; `'unevaluable'` when it cannot say, `null` to show nothing. */
  phase = input<DayPhase | 'unevaluable' | null>(null);
  /** Decides which phase reads as welcome and which as not; without one the tag stays neutral. */
  goal = input<CycleGoal | null>(null);
  hasPrevious = input(false);
  hasNext = input(false);

  edit = output<MeasurementGraphData>();
  add = output<Date>();
  step = output<-1 | 1>();

  private today = new Date();

  date = computed(() => {
    const start = this.cycleStartDate();
    if (!start) return null;
    const date = new Date(start);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + this.day() - 1);
    return date;
  });

  temperature = computed(() => this.entry()?.temperature ?? null);

  phaseTone = computed<'positive' | 'negative' | 'neutral' | 'none'>(() => {
    const phase = this.phase();
    const goal = this.goal();
    if (phase === null || phase === 'unevaluable') return 'none';
    if (goal === null) return 'neutral';
    const wanted = goal === 'avoid' ? 'infertile' : 'fertile';
    return phase === wanted ? 'positive' : 'negative';
  });

  /** Recording a day ahead would be a prediction, not an observation. */
  canAdd = computed(() => {
    const date = this.date();
    return date !== null && date.getTime() <= this.today.getTime();
  });

  /** `disturbed` is shown beside the temperature, so it is not repeated as a badge. */
  markers = computed<MarkerChip[]>(() =>
    (this.evaluation()?.markers ?? [])
      .filter(
        (marker) => marker.day === this.day() && marker.kind !== 'disturbed'
      )
      .map((marker) => ({
        signKey: marker.kind.startsWith('temperature')
          ? 'home.day.sign.temperature'
          : 'home.day.sign.mucus',
        labelKey: `chart.marker.${marker.kind}`,
      }))
  );

  observations = computed<Observation[]>(() => {
    const entry = this.entry();
    // The same labels and values as the add form, not the sheet's Sensiplan abbreviations.
    const all: [string, string | undefined][] = [
      ['measurement.bleeding', entry?.bleeding],
      ['measurement.pain', entry?.pain],
      ['measurement.mucus.feeling', entry?.mucusFeeling],
      ['measurement.mucus.appearance', entry?.mucusAppearance],
      ['measurement.cervix.position', entry?.cervixPosition],
      ['measurement.cervix.openness', entry?.cervixOpenness],
      ['measurement.cervix.firmness', entry?.cervixFirmness],
      ['measurement.intercourse', entry?.intercourse],
      ['measurement.notes', entry?.notes],
    ];
    return all.flatMap(([labelKey, value]) =>
      value ? [{ labelKey, value }] : []
    );
  });

  onAction(): void {
    const entry = this.entry();
    const date = this.date();
    if (entry) this.edit.emit(entry);
    else if (date) this.add.emit(date);
  }
}
