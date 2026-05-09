import { Component, Input, OnChanges, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-cash-flow-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './cash-flow-chart.component.html',
  styleUrl: './cash-flow-chart.component.css'
})
export class CashFlowChartComponent implements OnChanges, DoCheck {
  @Input() flujos: number[] = [];
  @Input() label = 'Flujos de Caja';

  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  private _snapshot = '';

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(ctx.parsed.y ?? 0),
        },
      },
    },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (v) =>
            new Intl.NumberFormat('es-SV', { notation: 'compact' }).format(Number(v)),
        },
      },
      x: { grid: { display: false } },
    },
  };

  ngOnChanges(): void {
    this.buildChart();
  }

  ngDoCheck(): void {
    const snapshot = this.flujos.join(',');
    if (snapshot !== this._snapshot) {
      this.buildChart();
    }
  }

  private buildChart(): void {
    this._snapshot = this.flujos.join(',');
    this.chartData = {
      labels: this.flujos.map((_, i) => `Año ${i + 1}`),
      datasets: [{
        data: [...this.flujos],
        backgroundColor: this.flujos.map(f => f >= 0 ? 'rgba(99,102,241,0.7)' : 'rgba(244,63,94,0.7)'),
        borderColor:     this.flujos.map(f => f >= 0 ? '#6366f1' : '#f43f5e'),
        borderWidth: 1,
        borderRadius: 4,
      }],
    };
  }
}
