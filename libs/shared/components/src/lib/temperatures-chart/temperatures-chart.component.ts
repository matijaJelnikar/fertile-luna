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
      type: 'line', // Line chart
      data: {
        labels: this.timestampData(), // X-axis labels: formatted timestamps
        datasets: [
          {
            label: 'Temperature (°C)', // Label for the dataset
            data: this.temperatureData(), // Y-axis data: temperature values
            borderColor: 'rgba(75, 192, 192, 1)', // Line color
            borderWidth: 2,
            fill: false, // Do not fill the area under the line
            tension: 0.1, // Smoothing the line
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: {
              autoSkip: true, // Automatically skip labels to avoid clutter
              maxTicksLimit: 20, // Limit the number of ticks on the x-axis
            },
          },
          y: {
            beginAtZero: false, // Do not force the y-axis to start at 0
          },
        },
      },
    };

    // Create the chart with the configuration
    this.chart = new Chart('temperatureChart', chartData);
  }
}
