import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  CycleEvaluation,
  DayMarkerKind,
  MeasurementGraphData,
  phaseOnDay,
} from '@basal-temp-log-workspace/model';

/**
 * The narrowest a day's column may get, so a day stays a finger-sized target on a phone.
 * Below this the sheet scrolls rather than shrinks.
 */
const MIN_COLUMN_WIDTH = 36;
/** The paper sheet has 40 columns (`#R-CYCLE-01`); empty days ahead are drawn only up to that. */
const SHEET_DAYS = 40;
/** One square is 0.1 °C, as the method's own sheet is ruled (`#R-TEMP-02`). */
const SQUARES_PER_DEGREE = 10;
const SQUARE_HEIGHT = 18;
const DEFAULT_RANGE = { min: 36.0, max: 37.0 };
/** The least span shown, so a flat week reads as flat instead of being stretched into noise. */
const MIN_SPAN = 1.0;

/** Rounds to a half degree without floating-point drift (36.9 + 0.1 must be 37.0, not 37.0000001). */
const toHalfDegree = (value: number, round: (n: number) => number): number =>
  round(Math.round(value * 20) / 10) / 2;

export interface CurvePoint {
  readonly day: number;
  readonly x: number;
  readonly y: number;
  readonly temperature: number;
  readonly disturbed: boolean;
  /** The triangle the method draws over a counted raised value (`#R-TEMP-02`), or `null`. */
  readonly triangle: string | null;
}

interface RowCell {
  readonly day: number;
  readonly text: string;
  readonly peak: boolean;
  /** 1–3 on the days counted after the mucus peak (`#R-MUCUS-03`). */
  readonly count: number | null;
}

type RowKey = 'mucus' | 'bleeding' | 'sensation' | 'appearance' | 'cervix' | 'intercourse' | 'phase';

interface ObservationRow {
  readonly key: RowKey;
  readonly labelKey: string;
  readonly cells: readonly RowCell[];
}

interface DayColumn {
  readonly day: number;
  readonly x: number;
  readonly right: number;
  readonly label: string;
  readonly selected: boolean;
  readonly tabIndex: number;
}

/**
 * The Zyklusblatt: the temperature curve with the day's observations aligned in rows directly
 * beneath it, on one shared cycle-day axis. Reading down a column is how the method is practised.
 *
 * Drawn as SVG over a CSS grid rather than on a canvas, because the rows and the curve must share
 * an axis exactly, and because a canvas holds no text for a screen reader to read.
 *
 * It decides nothing. Every mark comes from the engine's result; where the engine reports a rule as
 * unevaluable, nothing is drawn for it.
 */
@Component({
  selector: 'lib-temperatures-chart',
  templateUrl: './temperatures-chart.component.html',
  styleUrl: './temperatures-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, TranslatePipe],
  host: {
    class: 'zyklusblatt',
    // One listener for the whole sheet: a tap anywhere in a column selects that day.
    '(click)': 'selectFrom($event)',
  },
})
export class TemperaturesChartComponent {
  private translate = inject(TranslateService);
  /** Read inside computeds so their text follows a language that finishes loading after the data. */
  private language = toSignal(this.translate.onLangChange);

  /** Every entry of the cycle. Entries with no cycle day are not drawn — they have no column. */
  entries = input<readonly MeasurementGraphData[]>([]);
  /** The engine's output; the sole source of every marker, line and phase boundary drawn here. */
  evaluation = input<CycleEvaluation | null>(null);
  /** The day being read; `null` falls back to the last recorded day. */
  selectedDay = model<number | null>(null);
  /** A horizontal scroll to restore on the first draw, as the host page left it. */
  initialScroll = input<number | null>(null);
  /** Collapsed, only the curve and the day axis are shown; the host page reads the day out. */
  showAllRows = model(false);

  private scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private dayButtons = viewChildren<ElementRef<HTMLButtonElement>>('dayButton');
  /** The width available to the days, measured; 0 until it has been. */
  private viewport = signal(0);
  private scrollRestored = false;

  private placed = computed(() =>
    [...this.entries()]
      .filter((entry) => entry.day !== null)
      .sort((a, b) => (a.day as number) - (b.day as number))
  );

  private byDay = computed(
    () => new Map(this.placed().map((entry) => [entry.day as number, entry]))
  );

  private lastDay = computed(() =>
    this.placed().reduce((max, entry) => Math.max(max, entry.day as number), 0)
  );

  /**
   * Cycle days 1 to the last recorded — never positions in an array — padded with empty days ahead
   * while they fit, as the paper sheet has its blank columns.
   */
  days = computed<number[]>(() => {
    const fit = Math.min(Math.floor(this.viewport() / MIN_COLUMN_WIDTH), SHEET_DAYS);
    return Array.from({ length: Math.max(this.lastDay(), fit, 1) }, (_, i) => i + 1);
  });

  /** The one axis definition. The curve, the day buttons and every row are laid out from it. */
  columnWidth = computed(() =>
    Math.max(MIN_COLUMN_WIDTH, this.viewport() / this.days().length)
  );
  sheetWidth = computed(() => this.days().length * this.columnWidth());
  columns = computed(() => `repeat(${this.days().length}, ${this.columnWidth()}px)`);

  /** Opens on the last recorded day: it is the day being charted, and the one worth reading first. */
  activeDay = computed(() => this.selectedDay() ?? (this.lastDay() || null));
  private focusDay = computed(() => this.activeDay() ?? 1);

  dayColumns = computed<DayColumn[]>(() => {
    this.language();
    const width = this.columnWidth();
    return this.days().map((day) => ({
      day,
      x: (day - 1) * width,
      right: day * width,
      label: this.translate.instant('chart.day', { day }),
      selected: day === this.activeDay(),
      tabIndex: day === this.focusDay() ? 0 : -1,
    }));
  });

  selectedColumn = computed(() => this.dayColumns().find((column) => column.selected) ?? null);

  private helperTemperature = computed(() => {
    const temperature = this.evaluation()?.temperature;
    return temperature?.status === 'satisfied' ? temperature.result.helperLineTemperature : null;
  });

  /**
   * Fitted to what was measured, in half degrees, so nothing is clamped to a fixed band and a phone
   * does not spend its height on empty squares. The 0.1 °C square never changes.
   */
  private range = computed(() => {
    const values = this.placed().flatMap((entry) =>
      entry.temperature != null ? [entry.temperature] : []
    );
    const helper = this.helperTemperature();
    if (helper !== null) values.push(helper);
    if (values.length === 0) return DEFAULT_RANGE;

    // A tenth of headroom either side keeps a triangle over the top value inside the drawing.
    const min = toHalfDegree(Math.min(...values) - 0.1, Math.floor);
    const max = Math.max(toHalfDegree(Math.max(...values) + 0.1, Math.ceil), min + MIN_SPAN);
    return { min, max };
  });

  private squares = computed(() =>
    Math.round((this.range().max - this.range().min) * SQUARES_PER_DEGREE)
  );
  chartHeight = computed(() => this.squares() * SQUARE_HEIGHT);

  /** Horizontal rules, one per 0.1 °C, labelled every half degree as the sheet is. */
  gridLines = computed(() => {
    const top = Math.round(this.range().max * SQUARES_PER_DEGREE);
    return Array.from({ length: this.squares() + 1 }, (_, step) => {
      const tenths = top - step;
      return {
        y: step * SQUARE_HEIGHT,
        label: tenths % 5 === 0 ? (tenths / SQUARES_PER_DEGREE).toFixed(1) : null,
      };
    });
  });
  ticks = computed(() => this.gridLines().filter((line) => line.label !== null));

  private markersByDay = computed(() => {
    const byDay = new Map<number, DayMarkerKind[]>();
    for (const marker of this.evaluation()?.markers ?? []) {
      byDay.set(marker.day, [...(byDay.get(marker.day) ?? []), marker.kind]);
    }
    return byDay;
  });

  private symbols = computed(
    () => new Map((this.evaluation()?.mucusByDay ?? []).map((d) => [d.day, d.symbol]))
  );

  points = computed<CurvePoint[]>(() =>
    this.placed().flatMap((entry) => {
      if (entry.temperature == null) return [];
      const day = entry.day as number;
      const x = this.xFor(day);
      const y = this.yFor(entry.temperature);
      // `temperature-uncounted` is deliberately not drawn: the book says a skipped dip is neither
      // taken into account nor marked (`#R-TEMP-04`).
      const counted = (this.markersByDay().get(day) ?? []).some((kind) =>
        kind.startsWith('temperature-counted')
      );
      return [
        {
          day,
          x,
          y,
          temperature: entry.temperature,
          disturbed: !!entry.disturbed,
          triangle: counted ? `${x},${y - 11} ${x - 8},${y + 4} ${x + 8},${y + 4}` : null,
        },
      ];
    })
  );

  /**
   * The curve, split wherever a day carries no temperature. Separate polylines are the whole point:
   * one line drawn through a gap would show a measurement that was never taken.
   */
  segments = computed<string[]>(() => {
    const runs: CurvePoint[][] = [];
    let run: CurvePoint[] = [];
    let previousDay: number | null = null;

    for (const point of this.points()) {
      if (previousDay !== null && point.day !== previousDay + 1) {
        if (run.length) runs.push(run);
        run = [];
      }
      run.push(point);
      previousDay = point.day;
    }
    if (run.length) runs.push(run);

    return runs
      .filter((segment) => segment.length > 1)
      .map((segment) => segment.map((p) => `${p.x},${p.y}`).join(' '));
  });

  /** Drawn only when the engine evaluated a shift — never guessed at here. */
  helperLine = computed(() => {
    const temperature = this.evaluation()?.temperature;
    if (temperature?.status !== 'satisfied') return null;

    const { helperLineTemperature, helperLineDays, completedOnDay } = temperature.result;
    const half = this.columnWidth() / 2;
    return {
      y: this.yFor(helperLineTemperature),
      x1: this.xFor(helperLineDays[0]) - half,
      x2: this.xFor(completedOnDay) + half,
      temperature: helperLineTemperature,
    };
  });

  /** Where the post-ovulatory infertile phase begins, once both signs are in (`#R-COMBI-01`). */
  infertileFromDay = computed(() => {
    const phase = this.evaluation()?.postOvulatory;
    return phase?.status === 'satisfied' ? phase.result.infertileFromDay : null;
  });

  private allRows = computed<ObservationRow[]>(() => {
    const byDay = this.byDay();

    // An empty string means "not recorded". A recorded "None" prints its own abbreviation, so the
    // two never look alike.
    const cell = (day: number, text?: string): RowCell => ({
      day,
      text: text ?? '',
      peak: false,
      count: null,
    });

    const initials = (...values: (string | undefined)[]): string =>
      values.filter(Boolean).map((v) => (v as string).charAt(0)).join('');

    return [
      {
        key: 'mucus',
        labelKey: 'chart.row.short.mucus',
        cells: this.days().map((day) => {
          const kinds = this.markersByDay().get(day) ?? [];
          const postPeak = kinds.find((kind) => kind.startsWith('post-peak-'));
          return {
            ...cell(day, this.symbols().get(day)),
            peak: kinds.includes('mucus-peak'),
            count: postPeak ? Number(postPeak.slice(-1)) : null,
          };
        }),
      },
      {
        key: 'bleeding',
        labelKey: 'chart.row.short.bleeding',
        cells: this.days().map((day) => cell(day, initials(byDay.get(day)?.bleeding))),
      },
      {
        key: 'sensation',
        labelKey: 'chart.row.short.sensation',
        cells: this.days().map((day) => cell(day, byDay.get(day)?.mucusFeeling?.slice(0, 2))),
      },
      {
        key: 'appearance',
        labelKey: 'chart.row.short.appearance',
        cells: this.days().map((day) => cell(day, byDay.get(day)?.mucusAppearance?.slice(0, 2))),
      },
      {
        key: 'cervix',
        labelKey: 'chart.row.short.cervix',
        cells: this.days().map((day) => {
          const entry = byDay.get(day);
          return cell(day, initials(entry?.cervixOpenness, entry?.cervixFirmness));
        }),
      },
      {
        key: 'intercourse',
        labelKey: 'chart.row.short.intercourse',
        cells: this.days().map((day) => cell(day, initials(byDay.get(day)?.intercourse))),
      },
      {
        key: 'phase',
        labelKey: 'chart.row.short.fertile',
        cells: this.days().map((day) =>
          // Past the last recorded day the row stays blank: marking days ahead would be a prediction.
          cell(day, day <= this.lastDay() && phaseOnDay(this.evaluation(), day) === 'fertile' ? 'P' : undefined)
        ),
      },
    ];
  });

  rows = computed(() => (this.showAllRows() ? this.allRows() : []));

  /** Method state as a sentence, for the text alternative. */
  phaseState = computed(() => {
    this.language();
    const from = this.infertileFromDay();
    return from === null
      ? this.translate.instant('chart.phase.unevaluable')
      : this.translate.instant('chart.phase.confirmed.from', { day: from });
  });

  /** The selected day in words — the touch equivalent of a tooltip, and read out when it changes. */
  selectedSummary = computed(() => {
    const day = this.activeDay();
    return day === null ? '' : this.describeDay(day);
  });

  /**
   * The same content as the drawing, in words, built from the same data — so it cannot drift from
   * what is shown.
   */
  textAlternative = computed(() =>
    [this.phaseState(), ...this.placed().map((entry) => this.describeDay(entry.day as number))]
      .filter(Boolean)
      .join('. ')
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => this.viewport.set(entry.contentRect.width));
      observer.observe(this.scroller().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    // Keeps the day being read in view: on opening that is the latest, the part a phone cannot fit.
    afterRenderEffect(() => {
      const element = this.scroller().nativeElement;
      const width = this.columnWidth();
      const day = this.activeDay() ?? 1;
      // Before the width is measured the sheet is too narrow to hold the restored offset.
      if (this.viewport() === 0) return;

      const restore = untracked(this.initialScroll);
      if (!this.scrollRestored) {
        this.scrollRestored = true;
        if (restore !== null) {
          element.scrollLeft = restore;
          return;
        }
      }

      const left = (day - 1) * width;
      const right = day * width;
      if (left < element.scrollLeft) element.scrollLeft = left;
      else if (right > element.scrollLeft + element.clientWidth) {
        element.scrollLeft = right - element.clientWidth;
      }
    });
  }

  /** How far the days are scrolled, so a host page can hand it back through `initialScroll`. */
  scrollOffset(): number {
    return this.scroller().nativeElement.scrollLeft;
  }

  selectFrom(event: Event): void {
    const day = (event.target as Element | null)
      ?.closest('[data-day]')
      ?.getAttribute('data-day');
    if (day) this.selectedDay.set(Number(day));
  }

  toggleRows(): void {
    this.showAllRows.update((all) => !all);
  }

  /** Arrow keys walk the days, so the grid is readable one column at a time without a pointer. */
  moveSelection(event: KeyboardEvent, day: number): void {
    const last = this.days().length;
    const moves: Record<string, number> = {
      ArrowLeft: day - 1,
      ArrowRight: day + 1,
      Home: 1,
      End: last,
    };
    const target = moves[event.key];
    if (target === undefined || target < 1 || target > last) return;

    event.preventDefault();
    this.selectedDay.set(target);
    this.dayButtons()[target - 1]?.nativeElement.focus();
  }

  private describeDay(day: number): string {
    this.language();
    const t = (key: string, params?: object): string => this.translate.instant(key, params);
    const entry = this.byDay().get(day);

    const parts = [t('chart.day', { day })];
    if (entry?.temperature != null) {
      parts.push(
        `${entry.temperature} °C${entry.disturbed ? ` (${t('chart.marker.disturbed')})` : ''}`
      );
    } else {
      parts.push(t('chart.no.temperature'));
    }

    for (const kind of this.markersByDay().get(day) ?? []) {
      if (kind !== 'disturbed') parts.push(t(`chart.marker.${kind}`));
    }

    const cervix = [entry?.cervixOpenness, entry?.cervixFirmness].filter(Boolean).join(', ');
    const observations: [string, string | undefined][] = [
      ['chart.row.mucus', this.symbols().get(day)],
      ['chart.row.bleeding', entry?.bleeding],
      ['chart.row.sensation', entry?.mucusFeeling],
      ['chart.row.appearance', entry?.mucusAppearance],
      ['chart.row.cervix', cervix || undefined],
      ['chart.row.intercourse', entry?.intercourse],
    ];
    for (const [key, value] of observations) {
      if (value) parts.push(`${t(key)}: ${value}`);
    }

    return parts.join(', ');
  }

  private xFor(day: number): number {
    return (day - 0.5) * this.columnWidth();
  }

  private yFor(temperature: number): number {
    return (this.range().max - temperature) * SQUARES_PER_DEGREE * SQUARE_HEIGHT;
  }
}
