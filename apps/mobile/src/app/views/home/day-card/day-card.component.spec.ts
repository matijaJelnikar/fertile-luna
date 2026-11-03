import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import {
  CycleEvaluation,
  MeasurementGraphData,
  MucusSymbol,
} from '@basal-temp-log-workspace/model';
import { DayCardComponent } from './day-card.component';

const EVALUATION = {
  markers: [
    { day: 5, kind: 'mucus-peak' },
    { day: 5, kind: 'disturbed' },
    { day: 6, kind: 'post-peak-1' },
  ],
  mucusByDay: [{ day: 5, symbol: MucusSymbol.BestQuality }],
} as unknown as CycleEvaluation;

const ENTRY = {
  uuid: 'm-5',
  date: new Date(2026, 3, 5),
  day: 5,
  temperature: 36.6,
  disturbed: true,
  bleeding: 'Light',
  mucusFeeling: 'Dry',
  cervixOpenness: 'Closed',
  cervixFirmness: 'Firm',
} as MeasurementGraphData;

describe('DayCardComponent', () => {
  let fixture: ComponentFixture<DayCardComponent>;

  const text = (): string => fixture.nativeElement.textContent;
  const button = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('button.day-action');
  const arrow = (label: string): HTMLButtonElement =>
    fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);

  const setup = (
    day: number,
    entry: MeasurementGraphData | null,
    start: Date
  ) => {
    fixture.componentRef.setInput('day', day);
    fixture.componentRef.setInput('entry', entry);
    fixture.componentRef.setInput('evaluation', EVALUATION);
    fixture.componentRef.setInput('cycleStartDate', start);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayCardComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      chart: {
        day: 'Cycle day {{day}}',
        marker: { 'mucus-peak': 'Mucus peak', disturbed: 'Disturbed' },
      },
      measurement: {
        bleeding: 'Bleeding',
        mucus: { feeling: 'Mucus - Feeling' },
        cervix: {
          openness: 'Cervix - Openness',
          firmness: 'Cervix - Firmness',
        },
      },
      home: {
        day: {
          edit: 'Edit',
          add: 'Add',
          nothing: 'Nothing recorded',
          previous: 'Previous day',
          next: 'Next day',
          sign: { mucus: 'Mucus', temperature: 'Temperature' },
        },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(DayCardComponent);
  });

  it('writes the day out in full, with its date and the marks the engine set on it', () => {
    setup(5, ENTRY, new Date(2026, 3, 1));

    expect(text()).toContain('Cycle day 5');
    expect(text()).toContain('5 Apr');
    expect(text()).toContain('36.6°C');
    expect(text()).toContain('Disturbed');
    expect(text()).toContain('Light');
    expect(text()).toContain('Closed');
    expect(text()).toContain('Firm');
    // Worded as the add form words it, never as the sheet's Sensiplan symbol.
    expect(text()).toContain('Mucus - Feeling');
    expect(text()).toContain('Dry');
    expect(text()).not.toContain('S+');
    // Disturbed is shown beside the temperature, not again as a badge.
    const chips = fixture.nativeElement.querySelectorAll('li');
    expect(chips).toHaveLength(1);
    // Each mark names the sign it belongs to.
    expect(chips[0].textContent).toContain('Mucus: Mucus peak');
  });

  it('opens a recorded day for editing', () => {
    setup(5, ENTRY, new Date(2026, 3, 1));
    const edited = jest.fn();
    fixture.componentInstance.edit.subscribe(edited);

    button()?.click();

    expect(button()?.getAttribute('aria-label')).toBe('Edit');
    expect(edited).toHaveBeenCalledWith(ENTRY);
  });

  it('offers to record an empty past day on its own date', () => {
    setup(3, null, new Date(2026, 3, 1));
    const added = jest.fn();
    fixture.componentInstance.add.subscribe(added);

    button()?.click();

    expect(text()).toContain('Nothing recorded');
    expect(added).toHaveBeenCalledWith(new Date(2026, 3, 3));
  });

  it('steps to the neighbouring days, and only as far as the host allows', () => {
    fixture.componentRef.setInput('hasPrevious', true);
    setup(5, ENTRY, new Date(2026, 3, 1));
    const steps = jest.fn();
    fixture.componentInstance.step.subscribe(steps);

    arrow('Previous day').click();

    expect(steps).toHaveBeenCalledWith(-1);
    expect(arrow('Next day').disabled).toBe(true);
  });

  it('says so when a recorded day carries no observations', () => {
    setup(
      5,
      {
        uuid: 'm-5',
        date: new Date(2026, 3, 5),
        day: 5,
        temperature: 36.4,
      } as MeasurementGraphData,
      new Date(2026, 3, 1)
    );

    expect(text()).toContain('home.day.no.observations');
  });

  it('names the method phase of the day in words', () => {
    fixture.componentRef.setInput('phase', 'fertile');
    setup(5, ENTRY, new Date(2026, 3, 1));

    expect(text()).toContain('home.day.phase.fertile');
  });

  it.each([
    ['avoid', 'infertile', 'positive'],
    ['avoid', 'fertile', 'negative'],
    ['conceive', 'fertile', 'positive'],
    ['conceive', 'infertile', 'negative'],
    [null, 'fertile', 'neutral'],
    ['avoid', 'unevaluable', 'none'],
  ] as const)('with goal %s, colours a %s day %s', (goal, phase, tone) => {
    fixture.componentRef.setInput('goal', goal);
    fixture.componentRef.setInput('phase', phase);
    setup(5, ENTRY, new Date(2026, 3, 1));

    expect(fixture.componentInstance.phaseTone()).toBe(tone);
  });

  it('offers nothing for a day that has not happened yet', () => {
    const start = new Date();
    setup(10, null, start);

    expect(button()).toBeNull();
  });
});
