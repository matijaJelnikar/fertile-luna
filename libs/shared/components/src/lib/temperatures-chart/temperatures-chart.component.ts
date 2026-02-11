import { Component, effect, input, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MeasurementGraphData } from '@basal-temp-log-workspace/model';

// Register necessary Chart.js components
Chart.register(...registerables);

@Component({
  standalone: true,
  selector: 'lib-temperatures-chart',
  templateUrl: './temperatures-chart.component.html',
  styleUrls: ['./temperatures-chart.component.scss'],
})
export class TemperaturesChartComponent implements OnInit {
  temperatureData = input<number[]>([]);
  timestampData = input<string[]>([]);
  measurements = input<MeasurementGraphData[]>([]);
  chart!: Chart;

  constructor() {
    effect(() => {
      if (!this.chart) return;

      const tempData = this.temperatureData();
      const timeData = this.timestampData();
      this.measurements(); // Track measurements changes

      this.chart.data.labels = timeData;
      this.chart.data.datasets[0].data = tempData;
      this.chart.update();
    });
  }

  ngOnInit() {
    const chartData: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: this.timestampData(),
        datasets: [
          {
            label: 'Temperature (°C)',
            data: this.temperatureData(),
            borderColor: 'rgba(75, 192, 192, 1)', // Default line color
            borderWidth: 2,
            fill: false,
            tension: 0.1, // Smoothing effect

            // Segment-based color change
            segment: {
              borderColor: (ctx) => {
                if (!ctx.p0 || !ctx.p1) return 'rgba(75, 192, 192, 1)'; // Default color
                return ctx.p1.y > ctx.p0.y
                  ? 'rgba(255, 99, 132, 1)' // Red if increasing
                  : 'rgba(54, 162, 235, 1)'; // Blue if decreasing
              },
              borderWidth: (ctx) => (ctx.p1.y > ctx.p0.y ? 3 : 2), // Thicker if increasing
            },
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 20,
            },
          },
          y: {
            beginAtZero: false,
          },
        },
        plugins: {
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
                const index = context.dataIndex;
                const allMeasurements = this.measurements();
                const measurement = allMeasurements[index];
                if (!measurement) return '';

                const labels: string[] = [];
                labels.push(`Temperature: ${measurement.temperature}°C`);

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

    // Create the chart with the updated configuration
    this.chart = new Chart('temperatureChart', chartData);
  }
}
