import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  CycleWithDerived,
  FertilityAssessment,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';
import { of } from 'rxjs';

import { NewCycleComponent } from '../../components/new-cycle/new-cycle.component';
import { FertilityService } from '../../state/fertility/fertility.service';
import { CycleService } from '../../state/measurements/cycle.service';
import { UserService } from '../../state/user/user.service';
import { HomeComponent } from './home.component';
import { HomeService } from './home.service';

// The home screen embeds the Chart.js chart, and jsdom has no canvas 2d context for it.
// Charting is the chart component's own concern and is tested there.
jest.mock('chart.js', () => ({
  Chart: class {
    static register(): void {
      /* nothing to register against a double */
    }
    data = { labels: [], datasets: [{ data: [] }, { data: [] }] };
    update(): void {
      /* no canvas to redraw */
    }
  },
  registerables: [],
}));

const CYCLE = {
  uuid: 'cycle-2',
  cycleNumber: 2,
  startDate: new Date('2026-04-01'),
  bleedingLength: 5,
  length: null,
} as CycleWithDerived;

const PREVIOUS = { ...CYCLE, uuid: 'cycle-1', cycleNumber: 1, length: 28 };

const MEASUREMENTS: MeasurementGraphData[] = [
  { uuid: 'm-1', date: new Date('2026-04-01'), temperature: 36.4, day: 1 },
  { uuid: 'm-2', date: new Date('2026-04-02'), temperature: 36.5, day: 2 },
];

const NO_ASSESSMENT: FertilityAssessment = {
  riskLevel: 'high',
  isDoubleChecked: false,
  usedFactors: [],
  helperLineTemp: null,
  helperLineRange: null,
  infertilePhaseStartIndex: null,
  annotations: {},
};

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  const homeService = {
    measurements: signal(MEASUREMENTS),
    placedMeasurements: signal(MEASUREMENTS),
    currentCycle: signal<CycleWithDerived | null>(CYCLE),
    addMeasurement: jest.fn(() => of({})),
  };
  const cycleService = {
    cycles: signal([CYCLE, PREVIOUS]),
    cyclesWithDerived: signal([CYCLE, PREVIOUS]),
    currentCycleUuid: signal<string | null>('cycle-2'),
    setCurrentCycle: jest.fn(),
    startNewCycle: jest.fn(() => of({})),
  };
  const fertilityService = { calculateFertility: jest.fn(() => NO_ASSESSMENT) };
  const userService = { username: signal<string | null>('Ana') };
  const dialog = { open: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    cycleService.currentCycleUuid.set('cycle-2');

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule],
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

  it('charts the temperatures of the placed entries, keyed by cycle day', () => {
    expect(component.temperatureData()).toEqual([36.4, 36.5]);
    expect(component.timestampData()).toEqual(['1', '2']);
  });

  it('averages only the cycles that have finished', () => {
    expect(component.avgCycleLength()).toBe(28);
  });

  it('reports no shift while the evaluation has found none', () => {
    expect(component.tempShift()).toBeNull();
  });

  it('steps back to the previous cycle', () => {
    component.previousCycle();

    expect(cycleService.setCurrentCycle).toHaveBeenCalledWith('cycle-1');
  });

  it('does not step past the newest cycle', () => {
    component.nextCycle();

    expect(cycleService.setCurrentCycle).not.toHaveBeenCalled();
  });

  it('starts a new cycle with what the dialog returned', () => {
    dialog.open.mockReturnValue({
      afterClosed: () => of({ startDate: new Date('2026-05-01'), bleedingLength: 4 }),
    });

    component.startNewCycle();

    expect(dialog.open).toHaveBeenCalledWith(
      NewCycleComponent,
      expect.anything()
    );
    expect(cycleService.startNewCycle).toHaveBeenCalledWith({
      startDate: new Date('2026-05-01'),
      bleedingLength: 4,
    });
  });

  it('starts nothing when the new-cycle dialog is dismissed', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    component.startNewCycle();

    expect(cycleService.startNewCycle).not.toHaveBeenCalled();
  });

  it('records the day the add dialog returned', () => {
    const entry = { date: new Date('2026-04-03'), temperature: 36.7 };
    dialog.open.mockReturnValue({ afterClosed: () => of(entry) });

    component.addRecord();

    expect(homeService.addMeasurement).toHaveBeenCalledWith(entry);
  });
});
