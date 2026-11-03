import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import {
  CycleEvaluation,
  CycleWithDerived,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { of } from 'rxjs';

import { FertilityService } from '../../state/fertility/fertility.service';
import { CycleService } from '../../state/measurements/cycle.service';
import { UserService } from '../../state/user/user.service';
import { HomeComponent } from './home.component';
import { HomeService } from './home.service';

const CYCLE = {
  uuid: 'cycle-2',
  cycleNumber: 2,
  startDate: new Date('2026-04-01'),
  bleedingLength: 5,
  length: null,
} as CycleWithDerived;

const PREVIOUS = {
  ...CYCLE,
  uuid: 'cycle-1',
  cycleNumber: 1,
  startDate: new Date('2026-03-04'),
  length: 28,
};

const MEASUREMENTS: MeasurementGraphData[] = [
  { uuid: 'm-1', date: new Date('2026-04-01'), temperature: 36.4, day: 1 },
  { uuid: 'm-2', date: new Date('2026-04-02'), temperature: 36.5, day: 2 },
];

const PREVIOUS_ENTRIES: MeasurementGraphData[] = [
  { uuid: 'p-1', date: new Date('2026-03-04'), temperature: 36.3, day: 1 },
];

const NOTHING_EVALUATED: CycleEvaluation = {
  temperature: { status: 'unevaluable', missing: 'too-few-values' },
  mucus: { status: 'unevaluable', missing: 'not-recorded' },
  cervix: { status: 'unevaluable', missing: 'not-recorded' },
  preOvulatory: {
    status: 'unevaluable',
    missing: 'no-evaluated-previous-cycle',
  },
  postOvulatory: { status: 'unevaluable', missing: 'awaiting-second-sign' },
  markers: [],
  mucusByDay: [],
  unplaceableEntries: 0,
};

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  const homeService = {
    measurements: signal(MEASUREMENTS),
    placedMeasurements: signal(MEASUREMENTS),
    currentCycle: signal<CycleWithDerived | null>(CYCLE),
    history: signal([
      { cycle: PREVIOUS, entries: PREVIOUS_ENTRIES },
      { cycle: CYCLE, entries: MEASUREMENTS },
    ]),
    record: jest.fn(() => of({})),
    update: jest.fn(() => of({})),
  };
  const cycleService = {
    cycles: signal([CYCLE, PREVIOUS]),
    // As the real service orders them: `cycles` newest first, the derived list oldest first.
    cyclesWithDerived: signal([PREVIOUS, CYCLE]),
    currentCycleUuid: signal<string | null>('cycle-2'),
    setCurrentCycle: jest.fn(),
    startNewCycle: jest.fn(() => of({})),
  };
  const fertilityService = {
    evaluate: jest.fn(
      (_entries: readonly MeasurementGraphData[]): CycleEvaluation =>
        NOTHING_EVALUATED
    ),
  };
  const userService = {
    username: signal<string | null>('Ana'),
    contraceptionStoppedOn: signal<string | null>(null),
    goal: signal<'avoid' | 'conceive' | null>(null),
  };
  const dialog = { open: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.clear();
    fertilityService.evaluate.mockReturnValue(NOTHING_EVALUATED);
    cycleService.currentCycleUuid.set('cycle-2');
    userService.contraceptionStoppedOn.set(null);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
        { provide: CycleService, useValue: cycleService },
        { provide: FertilityService, useValue: fertilityService },
        { provide: UserService, useValue: userService },
        { provide: MatDialog, useValue: dialog },
      ],
    })
      .overrideComponent(HomeComponent, {
        set: { providers: [{ provide: HomeService, useValue: homeService }] },
      })
      .compileComponents();

    TestBed.inject(TranslateService).setTranslation('en', {
      home: { greeting: { named: 'Hey, {{name}}' } },
    });
    TestBed.inject(TranslateService).use('en');

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('greets the signed-in user by name', () => {
    expect(fixture.nativeElement.textContent).toContain('Hey, Ana');
  });

  it('hands the sheet the entries and the evaluation, and derives nothing itself', () => {
    const sheet = fixture.nativeElement.querySelector('lib-temperatures-chart');
    expect(sheet).toBeTruthy();
    expect(fertilityService.evaluate).toHaveBeenCalledWith(
      MEASUREMENTS,
      [],
      {}
    );
  });

  it('evaluates the first cycle after stopping hormonal contraception under its own rule', () => {
    // Stopped four days before this cycle began, and after the previous one did.
    userService.contraceptionStoppedOn.set('2026-03-28');
    fixture.detectChanges();

    expect(fertilityService.evaluate).toHaveBeenLastCalledWith(
      MEASUREMENTS,
      [],
      {
        afterHormonalContraception: { bleedingInFirstWeek: true },
      }
    );
  });

  it('averages only the cycles that have finished', () => {
    expect(component.avgCycleLength()).toBe(28);
  });

  it('averages the bleeding length over every cycle', () => {
    expect(component.avgBleedingLength()).toBe(5);
  });

  it('shows no first raised day until a temperature shift is confirmed', () => {
    expect(component.earliestFirstRaisedDay()).toBeNull();
  });

  it('takes the earliest first raised day across all cycles', () => {
    const shiftFrom = (first: number): CycleEvaluation => ({
      ...NOTHING_EVALUATED,
      temperature: {
        status: 'satisfied',
        result: {
          helperLineTemperature: 36.5,
          helperLineDays: [],
          countedDays: [first, first + 1, first + 2],
          uncountedDays: [],
          rule: 'R-TEMP-02',
          completedOnDay: first + 2,
        },
      },
    });
    fertilityService.evaluate.mockImplementation(
      (entries: readonly MeasurementGraphData[]) =>
        entries === PREVIOUS_ENTRIES ? shiftFrom(13) : shiftFrom(16)
    );

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.earliestFirstRaisedDay()).toBe(13);
    expect(fixture.nativeElement.textContent).toContain('13');
  });

  it('shows the last recorded day until another is chosen on the sheet', () => {
    expect(component.shownDay()).toBe(2);
    expect(component.shownEntry()?.uuid).toBe('m-2');

    component.selectDay(1);

    expect(component.shownEntry()?.uuid).toBe('m-1');
  });

  it('steps through the days with the arrows, from day 1 to today in the open cycle', () => {
    jest.useFakeTimers({ now: new Date('2026-04-04T12:00:00') });
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

    expect(component.shownDay()).toBe(2);
    expect(component.lastNavigableDay()).toBe(4);
    jest.useRealTimers();

    component.stepDay(-1);
    expect(component.shownDay()).toBe(1);
    expect(cycleService.setCurrentCycle).not.toHaveBeenCalled();

    component.stepDay(1);
    component.stepDay(1);
    component.stepDay(1);
    component.stepDay(1);
    expect(component.shownDay()).toBe(4);
    // Today has nothing recorded yet, so the card offers to add it.
    expect(component.shownEntry()).toBeNull();
  });

  it('explains the empty space when the cycle has no days recorded', () => {
    homeService.placedMeasurements.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-day-card')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('home.day.none');
    homeService.placedMeasurements.set(MEASUREMENTS);
  });

  it('says the phase cannot be evaluated rather than guessing, and nothing past the last day', () => {
    expect(component.shownPhase()).toBe('unevaluable');

    component.selectDay(3);

    expect(component.shownPhase()).toBeNull();
  });

  it('keeps the chosen day when the home page is left and opened again', () => {
    component.selectDay(1);
    fixture.destroy();

    const reopened = TestBed.createComponent(HomeComponent).componentInstance;

    expect(reopened.shownDay()).toBe(1);
    expect(reopened.initialChartScroll).not.toBeNull();
  });

  it('steps from day 1 back to the last day of the previous cycle', () => {
    component.selectDay(1);

    component.stepDay(-1);

    expect(cycleService.setCurrentCycle).toHaveBeenCalledWith('cycle-1');
    cycleService.currentCycleUuid.set('cycle-1');
    expect(component.selectedDay()).toBe(28);
  });

  it('steps from the last day of a cycle on to day 1 of the next', () => {
    cycleService.currentCycleUuid.set('cycle-1');
    component.selectDay(28);

    component.stepDay(1);

    expect(cycleService.setCurrentCycle).toHaveBeenCalledWith('cycle-2');
    cycleService.currentCycleUuid.set('cycle-2');
    expect(component.selectedDay()).toBe(1);
  });

  it('returns to the last recorded day when another cycle is shown', () => {
    component.selectDay(1);
    cycleService.currentCycleUuid.set('cycle-1');

    expect(component.selectedDay()).toBeNull();
  });

  it('saves the changes to a day edited from its card', () => {
    const changes = { temperature: 36.8 };
    dialog.open.mockReturnValue({ afterClosed: () => of(changes) });

    component.editDay(MEASUREMENTS[1]);

    expect(dialog.open.mock.calls[0][1].data.mode).toBe('edit');
    expect(homeService.update).toHaveBeenCalledWith('m-2', changes);
  });

  it('remembers whether all rows of the sheet are shown', () => {
    component.showAllRows.set(true);
    fixture.detectChanges();

    expect(localStorage.getItem('fertileLuna_chartAllRows')).toBe('true');
  });

  it('describes method state, and never a risk', () => {
    const rendered = fixture.nativeElement.textContent.toLowerCase();
    for (const word of ['risk', 'safe', 'unsafe', 'danger']) {
      expect(rendered).not.toContain(word);
    }
  });

  it('starts a day from its card on that day', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });
    const date = new Date('2026-04-03');

    component.addRecord(date);

    expect(dialog.open.mock.calls[0][1].data.measurement.date).toBe(date);
  });

  it('steps back to the previous cycle', () => {
    component.previousCycle();

    expect(cycleService.setCurrentCycle).toHaveBeenCalledWith('cycle-1');
  });

  it('does not step past the newest cycle', () => {
    component.nextCycle();

    expect(cycleService.setCurrentCycle).not.toHaveBeenCalled();
  });

  it('records the day the add dialog returned', () => {
    const entry = { date: new Date('2026-04-03'), temperature: 36.7 };
    dialog.open.mockReturnValue({ afterClosed: () => of(entry) });

    component.addRecord();

    expect(homeService.record).toHaveBeenCalledWith(entry);
  });

  it('records nothing when the add dialog is dismissed', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    component.addRecord();

    expect(homeService.record).not.toHaveBeenCalled();
  });
});
