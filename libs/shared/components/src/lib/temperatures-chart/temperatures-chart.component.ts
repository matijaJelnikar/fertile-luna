import { ChangeDetectionStrategy, Component, effect, input, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartDataset, registerables } from 'chart.js';
import {
  CycleEvaluation,
  DayMarkerKind,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';

Chart.register(...registerables);

const MARKER_LABELS: Record<DayMarkerKind, string> = {
  'mucus-peak': 'Mucus peak (V)',
  'post-peak-1': 'Post-peak day 1',
  'post-peak-2': 'Post-peak day 2',
  'post-peak-3': 'Post-peak day 3',
  'temperature-counted-1': 'Higher temperature 1',
  'temperature-counted-2': 'Higher temperature 2',
  'temperature-counted-3': 'Higher temperature 3',
  'temperature-counted-4': 'Higher temperature 4',
  'temperature-counted-5': 'Higher temperature 5',
  'temperature-uncounted': 'Not counted',
  disturbed: 'Disturbed — not taken into account',
};

/**
 * Markers are addressed by **cycle day**, never by array position: a day without a temperature is
 * charted as a gap, so position and day stop agreeing the moment one entry is missing.
 */
const markersByDay = (
  evaluation: CycleEvaluation | null
): ReadonlyMap<number, DayMarkerKind[]> => {
  const byDay = new Map<number, DayMarkerKind[]>();
  for (const marker of evaluation?.markers ?? []) {
    byDay.set(marker.day, [...(byDay.get(marker.day) ?? []), marker.kind]);
  }
  return byDay;
};

@Component({
  selector: 'lib-temperatures-chart',
  templateUrl: './temperatures-chart.component.html',
  styleUrls: ['./temperatures-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: flex; flex-direction: column; width: 100%; height: 100%;' },
})
export class TemperaturesChartComponent implements OnInit {
  temperatureData = input<number[]>([]);
  timestampData = input<string[]>([]);
  measurements = input<MeasurementGraphData[]>([]);
  evaluation = input<CycleEvaluation | null>(null);

  chart!: Chart;

  constructor() {
    effect(() => {
      if (!this.chart) return;

      const tempData = this.temperatureData();
      const timeData = this.timestampData();
      this.measurements();
      const fertility = this.evaluation();

      // Chart colors optimized for both light and dark modes
      const isDarkMode = document.body.classList.contains('dark');
      const healthyColor = isDarkMode ? 'rgba(80, 210, 80, 1)' : 'rgba(34, 197, 94, 1)';
      const fertileColor = isDarkMode ? 'rgba(240, 90, 70, 1)' : 'rgba(239, 68, 68, 1)';

      this.chart.data.labels = timeData;
      const lineDataset = this.chart.data.datasets[0] as ChartDataset<'line'>;
      lineDataset.data = tempData;
      lineDataset.pointStyle = this.buildPointStyles(tempData.length, fertility);
      lineDataset.pointBackgroundColor = this.buildPointColors(tempData.length, fertility, healthyColor, fertileColor);
      lineDataset.pointRadius = this.buildPointRadii(tempData.length, fertility);
      this.chart.data.datasets[1].data = this.buildHelperLineData(timeData.length, fertility);
      this.chart.update();
    });
  }

  ngOnInit() {
    const fertility = this.evaluation();
    const tempData = this.temperatureData();
    const timeData = this.timestampData();

    // Chart colors optimized for both light and dark modes
    const isDarkMode = document.body.classList.contains('dark');
    const lineColor = isDarkMode ? 'rgba(180, 140, 120, 1)' : 'rgba(54, 162, 235, 1)';
    const bleedingColor = isDarkMode ? 'rgba(200, 120, 120, 1)' : 'rgba(255, 99, 132, 1)';
    const helperLineColor = isDarkMode ? 'rgba(200, 160, 100, 1)' : 'rgba(255, 165, 0, 0.8)';
    const healthyColor = isDarkMode ? 'rgba(80, 210, 80, 1)' : 'rgba(34, 197, 94, 1)';
    const fertileColor = isDarkMode ? 'rgba(240, 90, 70, 1)' : 'rgba(239, 68, 68, 1)';

    const chartData: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: timeData,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: tempData,
            borderColor: lineColor,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointStyle: this.buildPointStyles(tempData.length, fertility),
            pointBackgroundColor: this.buildPointColors(tempData.length, fertility, healthyColor, fertileColor),
            pointRadius: this.buildPointRadii(tempData.length, fertility),
            segment: {
              borderColor: (ctx) => {
                const measurement = this.measurements()[ctx.p0DataIndex];
                return measurement?.bleeding ? bleedingColor : lineColor;
              },
            },
          },
          {
            label: 'Helper Line',
            data: this.buildHelperLineData(timeData.length, fertility),
            borderColor: helperLineColor,
            borderWidth: 1,
            borderDash: [6, 4],
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 35,
              maxRotation: 0,
              font: { size: 10 },
            },
            grid: {
              color: isDarkMode ? 'rgba(200, 160, 100, 0.15)' : 'rgba(200, 200, 200, 0.3)',
            },
          },
          y: {
            beginAtZero: false,
            grid: {
              color: isDarkMode ? 'rgba(200, 160, 100, 0.15)' : 'rgba(200, 200, 200, 0.3)',
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              filter: (item) => item.text !== 'Helper Line',
            },
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                const allMeasurements = this.measurements();
                const measurement = allMeasurements[index];
                if (!measurement) return '';
                const date = new Date(measurement.date).toLocaleDateString();
                return `Day ${measurement.day} - ${date}`;
              },
              label: (context) => {
                if (context.datasetIndex !== 0) return '';

                const index = context.dataIndex;
                const allMeasurements = this.measurements();
                const measurement = allMeasurements[index];
                if (!measurement) return '';

                const labels: string[] = [];
                labels.push(`Temperature: ${measurement.temperature}°C`);

                const fertility = this.evaluation();
                for (const kind of markersByDay(fertility).get(measurement.day ?? -1) ?? []) {
                  labels.push(MARKER_LABELS[kind]);
                }

                if (fertility?.temperature.status === 'satisfied') {
                  labels.push(
                    `Helper line: ${fertility.temperature.result.helperLineTemperature}°C`
                  );
                }

                if (measurement.bleeding) {
                  labels.push(`Bleeding: ${measurement.bleeding}`);
                }
                if (measurement.mucusFeeling) {
                  labels.push(`Mucus Feeling: ${measurement.mucusFeeling}`);
                }
                if (measurement.mucusAppearance) {
                  labels.push(`Mucus Appearance: ${measurement.mucusAppearance}`);
                }
                if (measurement.cervixPosition) {
                  labels.push(`Cervix Position: ${measurement.cervixPosition}`);
                }
                if (measurement.cervixOpenness) {
                  labels.push(`Cervix openness: ${measurement.cervixOpenness}`);
                }
                if (measurement.cervixFirmness) {
                  labels.push(`Cervix firmness: ${measurement.cervixFirmness}`);
                }
                if (measurement.pain) {
                  labels.push(`Pain: ${measurement.pain}`);
                }
                if (measurement.intercourse) {
                  labels.push(`Intercourse: ${measurement.intercourse}`);
                }
                if (measurement.notes) {
                  labels.push(`Notes: ${measurement.notes}`);
                }

                return labels;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart('temperatureChart', chartData);
  }

  private createVMarker(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 14;
    canvas.height = 14;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.font = 'bold 12px sans-serif';
    const isDarkMode = document.body.classList.contains('dark');
    ctx.fillStyle = isDarkMode ? 'rgba(80, 210, 80, 1)' : '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', 7, 8);
    return canvas;
  }

  private buildPointStyles(
    count: number,
    fertility: CycleEvaluation | null
  ): (string | HTMLCanvasElement | undefined)[] {
    const byDay = markersByDay(fertility);
    return Array.from({ length: count }, (_, i) => {
      const kinds = byDay.get(this.dayAt(i)) ?? [];
      if (kinds.includes('mucus-peak')) return this.createVMarker();
      if (kinds.some((k) => k.startsWith('post-peak'))) return 'rectRot';
      if (kinds.some((k) => k.startsWith('temperature-counted'))) return 'triangle';
      // A bracketed value is drawn, because the woman measured it — it is simply not counted.
      if (kinds.includes('disturbed')) return 'crossRot';
      return 'circle';
    });
  }

  /**
   * Phase colouring, by cycle day. These are the method's own phases, not a risk: a day is either
   * inside an evaluated infertile phase or it is not.
   */
  private buildPointColors(
    count: number,
    fertility: CycleEvaluation | null,
    infertileColor: string,
    fertileColor: string
  ): string[] {
    const postOvulatory =
      fertility?.postOvulatory.status === 'satisfied'
        ? fertility.postOvulatory.result.infertileFromDay
        : null;
    const preOvulatory =
      fertility?.preOvulatory.status === 'satisfied'
        ? fertility.preOvulatory.result.lastInfertileDay
        : null;

    return Array.from({ length: count }, (_, i) => {
      const day = this.dayAt(i);
      if (preOvulatory !== null && day <= preOvulatory) return infertileColor;
      if (postOvulatory !== null && day >= postOvulatory) return infertileColor;
      return fertileColor;
    });
  }

  private buildPointRadii(count: number, fertility: CycleEvaluation | null): number[] {
    const byDay = markersByDay(fertility);
    return Array.from({ length: count }, (_, i) => (byDay.has(this.dayAt(i)) ? 7 : 4));
  }

  /** The Hilfslinie, drawn across the six days it was taken from and the raised days that follow. */
  private buildHelperLineData(
    count: number,
    fertility: CycleEvaluation | null
  ): (number | null)[] {
    if (fertility?.temperature.status !== 'satisfied') return Array(count).fill(null);

    const { helperLineTemperature, helperLineDays, completedOnDay } = fertility.temperature.result;
    const from = helperLineDays[0];
    return Array.from({ length: count }, (_, i) => {
      const day = this.dayAt(i);
      return day >= from && day <= completedOnDay ? helperLineTemperature : null;
    });
  }

  private dayAt(index: number): number {
    return this.measurements()[index]?.day ?? -1;
  }
}
