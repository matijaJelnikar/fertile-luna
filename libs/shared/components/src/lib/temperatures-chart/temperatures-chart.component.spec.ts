import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemperaturesChartComponent } from './temperatures-chart.component';

interface ChartDouble {
  data: { labels: unknown; datasets: { data: unknown }[] };
  updates: number;
}

// jsdom has no canvas 2d context, so a real Chart half-initialises and then throws on update.
// What this component is responsible for is the data it hands the chart, so the chart is a double.
jest.mock('chart.js', () => {
  const instances: ChartDouble[] = [];

  class MockChart implements ChartDouble {
    static register(): void {
      /* the real Chart registers its controllers globally; nothing to do here */
    }

    data = { labels: [] as unknown, datasets: [{ data: [] }, { data: [] }] };
    updates = 0;

    constructor() {
      instances.push(this);
    }

    update(): void {
      this.updates++;
    }
  }

  return { Chart: MockChart, registerables: [], instances };
});

const { instances: chartInstances } = jest.requireMock('chart.js') as {
  instances: ChartDouble[];
};

describe('TemperaturesChartComponent', () => {
  let component: TemperaturesChartComponent;
  let fixture: ComponentFixture<TemperaturesChartComponent>;

  beforeEach(async () => {
    chartInstances.length = 0;

    await TestBed.configureTestingModule({
      imports: [TemperaturesChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TemperaturesChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('temperatureData', [36.4, 36.5, 36.8]);
    fixture.componentRef.setInput('timestampData', ['1', '2', '3']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the colour legend as a list', () => {
    const items = fixture.nativeElement.querySelectorAll('[role="listitem"]');
    expect(items).toHaveLength(2);
  });

  it('plots the temperatures it is given', () => {
    expect(chartInstances).toHaveLength(1);
    expect(chartInstances[0].data.datasets[0].data).toEqual([36.4, 36.5, 36.8]);
  });

  it('replots when the temperatures change', () => {
    fixture.componentRef.setInput('temperatureData', [36.4, 36.5, 36.9, 37.0]);
    fixture.detectChanges();

    expect(chartInstances[0].data.datasets[0].data).toEqual([
      36.4, 36.5, 36.9, 37.0,
    ]);
    expect(chartInstances[0].updates).toBeGreaterThan(0);
  });
});
