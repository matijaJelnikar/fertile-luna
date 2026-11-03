import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  const homeService = {
    measurements: signal(MEASUREMENTS),
    placedMeasurements: signal(MEASUREMENTS),
    currentCycle: signal<CycleWithDerived | null>(CYCLE),
    record: jest.fn(() => of({})),
  };
  const cycleService = {
    cycles: signal([CYCLE, PREVIOUS]),
    cyclesWithDerived: signal([CYCLE, PREVIOUS]),
    currentCycleUuid: signal<string | null>('cycle-2'),
    setCurrentCycle: jest.fn(),
    startNewCycle: jest.fn(() => of({})),
  };
  const fertilityService = { evaluate: jest.fn(() => NOTHING_EVALUATED) };
  const userService = {
    username: signal<string | null>('Ana'),
    contraceptionStoppedOn: signal<string | null>(null),
  };
  const dialog = { open: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    fertilityService.evaluate.mockReturnValue(NOTHING_EVALUATED);
    cycleService.currentCycleUuid.set('cycle-2');
    userService.contraceptionStoppedOn.set(null);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: CycleService, useValue: cycleService },
        { provide: FertilityService, useValue: fertilityService },
        { provide: UserService, useValue: userService },
        { provide: MatDialog, useValue: dialog },
      ],
    })
      // MaterialModule brings MatDialogModule into the component's own environment injector,
      // which shadows a TestBed-level provider — so the double goes on the component.
      .overrideComponent(HomeComponent, {
        set: {
          providers: [
            { provide: HomeService, useValue: homeService },
            { provide: MatDialog, useValue: dialog },
          ],
        },
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
    expect(fertilityService.evaluate).toHaveBeenCalledWith(MEASUREMENTS, [], {});
  });

  it('evaluates the first cycle after stopping hormonal contraception under its own rule', () => {
    // Stopped four days before this cycle began, and after the previous one did.
    userService.contraceptionStoppedOn.set('2026-03-28');
    fixture.detectChanges();

    expect(fertilityService.evaluate).toHaveBeenLastCalledWith(MEASUREMENTS, [], {
      afterHormonalContraception: { bleedingInFirstWeek: true },
    });
  });

  it('names the cervix as the awaited sign when no mucus is recorded', () => {
    fertilityService.evaluate.mockReturnValue({
      ...NOTHING_EVALUATED,
      temperature: {
        status: 'satisfied',
        result: {
          helperLineTemperature: 36.5,
          helperLineDays: [1, 2, 3, 4, 5, 6],
          countedDays: [7, 8, 9],
          uncountedDays: [],
          rule: 'R-TEMP-02',
          completedOnDay: 9,
        },
      },
      cervix: { status: 'unevaluable', missing: 'awaiting-days' },
    });
    homeService.measurements.set([...MEASUREMENTS]);

    expect(component.phaseStateKey()).toBe('home.phase.awaiting.cervix');
  });

  it('averages only the cycles that have finished', () => {
    expect(component.avgCycleLength()).toBe(28);
  });

  it('reports no shift while the evaluation has found none', () => {
    expect(component.tempShift()).toBeNull();
  });

  it('describes method state, and never a risk', () => {
    expect(component.phaseStateKey()).toBe('home.phase.awaiting.both');
    expect(component.infertileFromDay()).toBeNull();

    const rendered = fixture.nativeElement.textContent.toLowerCase();
    for (const word of ['risk', 'safe', 'unsafe', 'danger']) {
      expect(rendered).not.toContain(word);
    }
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
