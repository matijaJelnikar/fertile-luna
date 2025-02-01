import { Component, input, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

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
  chart!: Chart;

  constructor() {}

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
      },
    };

    // Create the chart with the updated configuration
    this.chart = new Chart('temperatureChart', chartData);
  }
}
