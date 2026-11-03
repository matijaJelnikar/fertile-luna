import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import {
  CycleEvaluation,
  MeasurementGraphData,
  MucusSymbol,
} from '@basal-temp-log-workspace/model';
import { TemperaturesChartComponent } from './temperatures-chart.component';

const entry = (
  day: number | null,
  over: Partial<MeasurementGraphData> = {}
): MeasurementGraphData =>
  ({ uuid: `d${day}`, date: new Date(2026, 0, day ?? 1), day, ...over }) as MeasurementGraphData;

const NOTHING_EVALUATED: CycleEvaluation = {
  temperature: { status: 'unevaluable', missing: 'too-few-values' },
  mucus: { status: 'unevaluable', missing: 'not-recorded' },
  cervix: { status: 'unevaluable', missing: 'not-recorded' },
  preOvulatory: { status: 'unevaluable', missing: 'no-evaluated-previous-cycle' },
  postOvulatory: { status: 'unevaluable', missing: 'awaiting-second-sign' },
  markers: [],
  mucusByDay: [],
  unplaceableEntries: 0,
};

const EVALUATED: CycleEvaluation = {
  temperature: {
    status: 'satisfied',
    result: {
      helperLineTemperature: 36.6,
      helperLineDays: [1, 2, 3, 4, 5, 6],
      countedDays: [7, 8, 9],
      uncountedDays: [],
      rule: 'R-TEMP-02',
      completedOnDay: 9,
    },
  },
  mucus: {
    status: 'satisfied',
    result: {
      peakDay: 5,
      bestSymbol: MucusSymbol.BestQuality,
      countDays: [6, 7, 8],
      completedOnDay: 8,
    },
  },
  cervix: { status: 'unevaluable', missing: 'not-recorded' },
  preOvulatory: {
    status: 'satisfied',
    result: { lastInfertileDay: 3, rule: 'R-FIRST-01', endedEarlyByMucus: false },
  },
  postOvulatory: {
    status: 'satisfied',
    result: { infertileFromDay: 9, temperatureCompletedOnDay: 9, mucusCompletedOnDay: 8 },
  },
  markers: [
    { day: 5, kind: 'mucus-peak' },
    { day: 6, kind: 'post-peak-1' },
    { day: 7, kind: 'post-peak-2' },
    { day: 8, kind: 'post-peak-3' },
    { day: 7, kind: 'temperature-counted-1' },
    { day: 8, kind: 'temperature-counted-2' },
    { day: 9, kind: 'temperature-counted-3' },
  ],
  mucusByDay: [
    { day: 4, symbol: MucusSymbol.Mucus },
    { day: 5, symbol: MucusSymbol.BestQuality },
  ],
  unplaceableEntries: 0,
};

/** jsdom has no layout, so the sheet's width is reported by hand, as a phone would report it. */
let reportWidth: (width: number) => void = () => undefined;
class FakeResizeObserver {
  constructor(callback: (entries: { contentRect: { width: number } }[]) => void) {
    reportWidth = (width) => callback([{ contentRect: { width } }]);
  }
  observe(): void {
    /* the width is pushed by reportWidth */
  }
  disconnect(): void {
    /* nothing to release */
  }
}

describe('TemperaturesChartComponent', () => {
  let fixture: ComponentFixture<TemperaturesChartComponent>;
  let component: TemperaturesChartComponent;
  let translate: TranslateService;

  const setup = (
    entries: MeasurementGraphData[],
    evaluation: CycleEvaluation | null = NOTHING_EVALUATED,
    showAllRows = true
  ) => {
    fixture.componentRef.setInput('showAllRows', showAllRows);
    fixture.componentRef.setInput('entries', entries);
    fixture.componentRef.setInput('evaluation', evaluation);
    fixture.detectChanges();
  };

  const onScreen = (width: number) => {
    reportWidth(width);
    fixture.detectChanges();
  };

  const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);

  beforeAll(() => Object.assign(globalThis, { ResizeObserver: FakeResizeObserver }));
  afterAll(() => Reflect.deleteProperty(globalThis, 'ResizeObserver'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemperaturesChartComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    // Real translations, so the assertions below read what a user would see rather than key names.
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      chart: {
        day: 'Cycle day {{day}}',
        'no.temperature': 'no temperature recorded',
        label: 'Cycle sheet',
        row: {
          day: 'Cycle day',
          mucus: 'Mucus',
          bleeding: 'Bleeding',
          sensation: 'Sensation',
          appearance: 'Appearance',
          cervix: 'Cervix',
          intercourse: 'Intercourse',
          fertile: 'Fertile days',
        },
        marker: {
          'mucus-peak': 'Mucus peak',
          'post-peak-1': 'First day after the peak',
          'post-peak-2': 'Second day after the peak',
          'post-peak-3': 'Third day after the peak',
          'temperature-counted-1': 'First higher temperature',
          'temperature-counted-2': 'Second higher temperature',
          'temperature-counted-3': 'Third higher temperature',
          disturbed: 'Disturbed, not taken into account',
        },
        phase: {
          fertile: 'Fertile phase',
          infertile: 'Infertile phase',
          unevaluable: 'The infertile phase cannot be evaluated yet',
          'confirmed.from': 'Infertile phase confirmed from cycle day {{day}}',
        },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(TemperaturesChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('the shared day axis', () => {
    it('spans cycle days 1 to the last recorded, gaps included', () => {
      setup([entry(1, { temperature: 36.5 }), entry(5, { temperature: 36.6 })]);

      expect(component.days()).toEqual([1, 2, 3, 4, 5]);
    });

    it('places a point by its cycle day, not by its position in the array', () => {
      setup([entry(1, { temperature: 36.5 }), entry(9, { temperature: 36.8 })]);

      const [first, second] = component.points();
      expect(first.day).toBe(1);
      expect(second.day).toBe(9);
      // Nine columns apart, not two.
      expect(second.x - first.x).toBe(8 * component.columnWidth());
    });

    it('does not move existing points when an earlier day is added', () => {
      setup([entry(3, { temperature: 36.5 }), entry(4, { temperature: 36.6 })]);
      const before = component.points().find((p) => p.day === 4);

      setup([
        entry(1, { temperature: 36.5 }),
        entry(3, { temperature: 36.5 }),
        entry(4, { temperature: 36.6 }),
      ]);

      const after = component.points().find((p) => p.day === 4);
      expect(after?.x).toBe(before?.x);
      expect(after?.y).toBe(before?.y);
    });

    it('leaves entries with no cycle day out of the drawing', () => {
      setup([entry(1, { temperature: 36.5 }), entry(null, { temperature: 36.9 })]);

      expect(component.points()).toHaveLength(1);
    });

    it('lays the curve, the day buttons and every row out on the same columns', () => {
      setup([entry(1, { temperature: 36.5 }), entry(4, { temperature: 36.6 })]);

      const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.row'));
      const templates = new Set(rows.map((row) => row.style.gridTemplateColumns));
      expect(templates.size).toBe(1);
      expect(query('.curve').getAttribute('width')).toBe(String(component.sheetWidth()));
    });
  });

  describe('on a phone', () => {
    it('fills a narrow screen with the blank days ahead instead of stretching three days', () => {
      setup([1, 2, 3].map((d) => entry(d, { temperature: 36.5 })), EVALUATED);
      onScreen(300);

      expect(component.days()).toHaveLength(8);
      expect(component.sheetWidth()).toBe(300);
      // Days ahead are blank: marking them would be a prediction.
      const phase = component.rows().find((r) => r.key === 'phase');
      expect(phase?.cells.slice(3).every((cell) => cell.text === '')).toBe(true);
    });

    it('scrolls a long cycle inside the sheet, with the scale and labels outside the scroll', () => {
      setup(Array.from({ length: 35 }, (_, i) => entry(i + 1, { temperature: 36.5 })));
      onScreen(300);

      // Columns keep a finger-sized width rather than squeezing 35 days into 300 px.
      expect(component.columnWidth()).toBe(36);
      expect(component.sheetWidth()).toBeGreaterThan(300);

      const scroller = query('.scroller');
      expect(scroller.contains(query('.sheet'))).toBe(true);
      expect(scroller.contains(query('.labels'))).toBe(false);
      expect(scroller.contains(query('.day'))).toBe(true);
    });

    it('never draws more blank days than the paper sheet has', () => {
      setup([entry(1, { temperature: 36.5 })]);
      onScreen(2000);

      expect(component.days()).toHaveLength(40);
    });
  });

  describe('the curve', () => {
    it('breaks at a day with no temperature rather than drawing through it', () => {
      setup([
        entry(1, { temperature: 36.5 }),
        entry(2, { temperature: 36.4 }),
        entry(3, {}),
        entry(4, { temperature: 36.7 }),
        entry(5, { temperature: 36.8 }),
      ]);

      // Two polylines, not one line bridging the gap.
      expect(component.segments()).toHaveLength(2);
      expect(fixture.nativeElement.querySelectorAll('.line')).toHaveLength(2);
    });

    it('draws a disturbed value at what was measured, marked as not counted', () => {
      setup([entry(1, { temperature: 37.1, disturbed: true })]);

      const point = component.points()[0];
      expect(point.temperature).toBe(37.1);
      expect(point.disturbed).toBe(true);
      expect(query('.bracket')).toBeTruthy();
    });

    it('draws the helper line at the engine value, across the days it names', () => {
      setup([entry(9, { temperature: 36.8 })], EVALUATED);

      const helper = component.helperLine();
      expect(helper?.temperature).toBe(36.6);
      expect(helper?.x1).toBeLessThan(helper?.x2 as number);
      expect(query('.helper-line')).toBeTruthy();
    });

    it('keeps a tenth of a degree to one square, so a 0.2 rise is always two squares', () => {
      setup([
        entry(1, { temperature: 36.4 }),
        entry(2, { temperature: 36.5 }),
        entry(3, { temperature: 36.6 }),
      ]);

      const [a, b, c] = component.points();
      expect(a.y - c.y).toBeCloseTo(2 * (a.y - b.y));
    });

    it('draws a value outside the usual band where it was measured, not clamped to the edge', () => {
      setup([entry(1, { temperature: 35.6 }), entry(2, { temperature: 37.9 })]);

      const [low, high] = component.points();
      expect(high.y).toBeGreaterThan(0);
      expect(low.y).toBeLessThan(component.chartHeight());
      expect(component.ticks().map((t) => t.label)).toEqual(
        expect.arrayContaining(['35.5', '38.0'])
      );
    });
  });

  describe('method state', () => {
    it('draws no markers and no helper line when nothing is evaluable', () => {
      setup([entry(1, { temperature: 36.5 }), entry(2, { temperature: 36.6 })]);

      expect(component.helperLine()).toBeNull();
      expect(query('.marker-counted')).toBeNull();
      expect(query('.cell--peak')).toBeNull();
      // The curve is still drawn — the data is real even when the rules cannot conclude.
      expect(query('.line')).toBeTruthy();
    });

    it('marks only the days the engine names', () => {
      setup(
        [5, 6, 7, 8, 9].map((d) => entry(d, { temperature: 36.7 })),
        EVALUATED
      );

      expect(fixture.nativeElement.querySelectorAll('.marker-counted')).toHaveLength(3);
      expect(component.points().filter((p) => p.triangle).map((p) => p.day)).toEqual([7, 8, 9]);
    });

    it('boxes the mucus peak and numbers the three days after it', () => {
      setup([entry(8, { temperature: 36.7 })], EVALUATED);

      const mucus = component.rows().find((r) => r.key === 'mucus');
      expect(mucus?.cells.filter((c) => c.peak).map((c) => c.day)).toEqual([5]);
      expect(mucus?.cells.slice(5, 8).map((c) => c.count)).toEqual([1, 2, 3]);
      expect(fixture.nativeElement.querySelectorAll('.cell--peak')).toHaveLength(1);
      expect(fixture.nativeElement.querySelectorAll('sup')).toHaveLength(3);
    });

    it('states the phase in words, not colour alone', () => {
      setup([entry(9, { temperature: 36.8 })], EVALUATED);

      expect(query('.visually-hidden').textContent).toContain(
        'Infertile phase confirmed from cycle day 9'
      );
    });
  });

  describe('observation rows', () => {
    const rowKeys = () => component.rows().map((row) => row.key);
    const toggle = () => query('.toggle');

    it('shows only the curve and the days until the rows are asked for', () => {
      setup([entry(1, { temperature: 36.5 })], NOTHING_EVALUATED, false);

      expect(rowKeys()).toEqual([]);
      expect(query('.day')).toBeTruthy();
      expect(toggle().getAttribute('aria-expanded')).toBe('false');

      toggle().click();
      fixture.detectChanges();

      expect(rowKeys()).toEqual([
        'mucus',
        'bleeding',
        'sensation',
        'appearance',
        'cervix',
        'intercourse',
        'phase',
      ]);
      expect(toggle().getAttribute('aria-expanded')).toBe('true');
      expect(component.showAllRows()).toBe(true);
    });

    it('shows every observation recorded for a day in that day`s column', () => {
      setup(
        [entry(4, { bleeding: 'Light', mucusFeeling: 'Wet', intercourse: 'Sex' } as never)],
        EVALUATED
      );

      const cellsForDay4 = component
        .rows()
        .map((row) => row.cells.find((cell) => cell.day === 4)?.text);

      // Mucus symbol, bleeding, sensation, and intercourse all present in column 4.
      expect(cellsForDay4[0]).toBe(MucusSymbol.Mucus);
      expect(cellsForDay4[1]).toBe('L');
      expect(cellsForDay4[2]).toBe('We');
      expect(cellsForDay4[5]).toBe('S');
    });

    it('renders an unrecorded observation differently from one recorded as none', () => {
      setup([entry(1, { mucusAppearance: 'None' } as never), entry(2, {})]);

      const appearance = component.rows().find((r) => r.key === 'appearance');
      expect(appearance?.cells[0].text).toBe('No');
      expect(appearance?.cells[1].text).toBe('');
    });

    it('marks fertile days only where the phase could be evaluated', () => {
      setup([entry(9, { temperature: 36.8 })], EVALUATED);
      const phase = component.rows().find((r) => r.key === 'phase');

      // Pre-ovulatory infertile through day 3, fertile 4-8, infertile from 9.
      expect(phase?.cells[0].text).toBe('');
      expect(phase?.cells[4].text).toBe('P');
      expect(phase?.cells[8].text).toBe('');
    });

    it('asserts nothing about a phase the engine could not evaluate', () => {
      setup([entry(1, { temperature: 36.5 })]);
      const phase = component.rows().find((r) => r.key === 'phase');

      expect(phase?.cells[0].text).toBe('');
      expect(component.phaseState()).toContain('cannot be evaluated');
    });
  });

  describe('reading a day', () => {
    const DAYS = [
      entry(4, { temperature: 36.5, bleeding: 'Light' } as never),
      entry(5, { temperature: 36.6, mucusFeeling: 'Wet' } as never),
    ];

    it('opens on the last recorded day', () => {
      setup(DAYS, EVALUATED);

      expect(query('[aria-live]').textContent).toContain('Cycle day 5');
      expect(query('.day[aria-pressed="true"]').textContent?.trim()).toBe('5');
    });

    it('shows a tapped column in words — the touch equivalent of a tooltip', () => {
      setup(DAYS, EVALUATED);

      query('.cell[data-day="4"]').click();
      fixture.detectChanges();

      const summary = query('[aria-live]').textContent;
      expect(summary).toContain('Cycle day 4');
      expect(summary).toContain('36.5 °C');
      expect(summary).toContain('Bleeding: Light');
      expect(component.selectedDay()).toBe(4);
    });

    it('scrolls a day chosen off-screen into view', () => {
      Object.defineProperty(query('.scroller'), 'clientWidth', { value: 300 });
      setup(Array.from({ length: 30 }, (_, i) => entry(i + 1, { temperature: 36.5 })));
      onScreen(300);
      const scroller = query('.scroller');
      // Opens on the last day, scrolled to the end.
      expect(scroller.scrollLeft).toBe(30 * 36 - 300);

      fixture.componentRef.setInput('selectedDay', 2);
      fixture.detectChanges();

      expect(scroller.scrollLeft).toBe(36);
    });

    it('opens at the scroll the host page hands back, instead of on the last day', () => {
      Object.defineProperty(query('.scroller'), 'clientWidth', { value: 300 });
      fixture.componentRef.setInput('initialScroll', 108);
      setup(Array.from({ length: 30 }, (_, i) => entry(i + 1, { temperature: 36.5 })));
      onScreen(300);

      expect(component.scrollOffset()).toBe(108);
    });

    it('follows a day chosen by the host page', () => {
      setup(DAYS, EVALUATED);

      fixture.componentRef.setInput('selectedDay', 4);
      fixture.detectChanges();

      expect(query('.day[aria-pressed="true"]').textContent?.trim()).toBe('4');
    });

    it('walks the days with the arrow keys, keeping one day in the tab order', () => {
      setup(DAYS, EVALUATED);
      const selected = query('.day[aria-pressed="true"]');

      selected.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();

      expect(query('[aria-live]').textContent).toContain('Cycle day 4');
      const focusable = fixture.nativeElement.querySelectorAll('.day[tabindex="0"]');
      expect(focusable).toHaveLength(1);
      expect(focusable[0].textContent.trim()).toBe('4');
      expect(document.activeElement).toBe(focusable[0]);
    });
  });

  describe('the text alternative', () => {
    it('names the days, their observations and the method state', () => {
      setup(
        [entry(4, { temperature: 36.5, bleeding: 'Light' } as never), entry(5, {})],
        EVALUATED
      );

      const text = query('.visually-hidden').textContent;
      expect(text).toContain('Infertile phase confirmed from cycle day 9');
      expect(text).toContain('Cycle day 4, 36.5 °C');
      expect(text).toContain('Bleeding: Light');
      expect(text).toContain('Mucus peak');
    });

    it('says a day carries no temperature rather than omitting it', () => {
      setup([entry(2, { mucusFeeling: 'Dry' } as never)]);

      expect(component.textAlternative()).toContain('no temperature recorded');
    });
  });

  it('draws every label from the translation catalogue', () => {
    // A locale with no chart keys: every string that is not data falls back to its key.
    // Also the default: ngx-translate otherwise falls back to 'en', the first language used.
    translate.setTranslation('xx', {});
    translate.setFallbackLang('xx');
    translate.use('xx');
    setup([entry(1, { temperature: 36.5 })]);

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.label'),
      (el: HTMLElement) => el.textContent?.trim()
    );
    expect(labels.every((label) => label?.startsWith('chart.'))).toBe(true);
    expect(component.phaseState()).toBe('chart.phase.unevaluable');
    expect(query('.day').getAttribute('aria-label')).toBe('chart.day');
  });

  it('carries no colour of its own, so a theme switch restyles it through the M3 tokens', () => {
    setup([entry(1, { temperature: 36.5 }), entry(2, { temperature: 36.6 })], EVALUATED);

    // Colour lives only in the stylesheet's `--mat-sys-*` tokens, which `body.dark` redefines.
    expect(fixture.nativeElement.querySelectorAll('[fill], [stroke], [style*="color"]')).toHaveLength(0);
  });

  it('uses no risk or safety wording anywhere', () => {
    setup([entry(9, { temperature: 36.8 })], EVALUATED);

    const rendered = fixture.nativeElement.textContent.toLowerCase();
    for (const word of ['risk', 'safe', 'unsafe', 'danger']) {
      expect(rendered).not.toContain(word);
    }
  });
});
