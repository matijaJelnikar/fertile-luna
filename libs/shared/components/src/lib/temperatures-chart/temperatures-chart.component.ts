import { ChangeDetectionStrategy, Component, effect, input, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartDataset, registerables } from 'chart.js';
import {
  FertilityAssessment,
  MeasurementGraphData,
} from '@basal-temp-log-workspace/model';

Chart.register(...registerables);

const ANNOTATION_LABELS: Record<string, string> = {
  'mucus-peak': 'Mucus Peak (V)',
  'post-peak-1': 'Post-Peak Day 1',
  'post-peak-2': 'Post-Peak Day 2',
  'post-peak-3': 'Post-Peak Day 3',
  'temp-shift-1': 'Temp Shift Day 1',
  'temp-shift-2': 'Temp Shift Day 2',
  'temp-shift-3': 'Temp Shift Day 3',
  'temp-shift-4': 'Temp Shift Day 4',
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
  fertilityAssessment = input<FertilityAssessment | null>(null);

  chart!: Chart;

  constructor() {
    effect(() => {
      if (!this.chart) return;

      const tempData = this.temperatureData();
      const timeData = this.timestampData();
      this.measurements();
      const fertility = this.fertilityAssessment();

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
    const fertility = this.fertilityAssessment();
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

                const fertility = this.fertilityAssessment();
                if (fertility?.annotations[index]) {
                  labels.push(`Marker: ${ANNOTATION_LABELS[fertility.annotations[index]]}`);
                }

                if (fertility?.helperLineTemp !== null && fertility?.helperLineRange) {
                  const [start, end] = fertility.helperLineRange;
                  if (index >= start && index <= end + 3) {
                    labels.push(`Helper line: ${fertility.helperLineTemp}°C`);
                  }
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
                if (measurement.cervixFeeling) {
                  labels.push(`Cervix Feeling: ${measurement.cervixFeeling}`);
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
    fertility: FertilityAssessment | null
  ): (string | HTMLCanvasElement | undefined)[] {
    return Array.from({ length: count }, (_, i) => {
      if (!fertility) return 'circle';
      const annotation = fertility.annotations[i];
      switch (annotation) {
        case 'mucus-peak': return this.createVMarker();
        case 'post-peak-1':
        case 'post-peak-2':
        case 'post-peak-3': return 'rectRot';
        case 'temp-shift-1':
        case 'temp-shift-2':
        case 'temp-shift-3':
        case 'temp-shift-4': return 'triangle';
        default: return 'circle';
      }
    });
  }

  private buildPointColors(
    count: number,
    fertility: FertilityAssessment | null,
    primaryColor: string,
    errorColor: string
  ): string[] {
    return Array.from({ length: count }, (_, i) => {
      if (!fertility || fertility.infertilePhaseStartIndex === null) {
        return errorColor; // red = fertile (no infertile phase confirmed yet)
      }
      if (i >= fertility.infertilePhaseStartIndex) {
        return primaryColor; // green = infertile/safe
      }
      return errorColor; // red = fertile
    });
  }

  private buildPointRadii(
    count: number,
    fertility: FertilityAssessment | null
  ): number[] {
    return Array.from({ length: count }, (_, i) => {
      if (!fertility) return 4;
      return fertility.annotations[i] ? 7 : 4;
    });
  }

  private buildHelperLineData(
    count: number,
    fertility: FertilityAssessment | null
  ): (number | null)[] {
    if (!fertility?.helperLineTemp || !fertility.helperLineRange) {
      return Array(count).fill(null);
    }
    const [start, end] = fertility.helperLineRange;
    return Array.from({ length: count }, (_, i) =>
      i >= start && i <= end + 3 ? fertility.helperLineTemp : null
    );
  }
}
