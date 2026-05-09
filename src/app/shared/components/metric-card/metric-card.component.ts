import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerdictBadgeComponent } from '../verdict-badge/verdict-badge.component';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, VerdictBadgeComponent],
  templateUrl: './metric-card.component.html',
  styles: ``
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() valor: number | null = null;
  @Input() formato: 'moneda' | 'porcentaje' | 'numero' = 'moneda';
  @Input() veredicto: 'ACEPTADO' | 'RECHAZADO' | 'INDIFERENTE' | null = null;
  @Input() prefijo = '';

  get valorFormateado(): string {
    if (this.valor === null) return '—';
    switch (this.formato) {
      case 'moneda':
        return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(this.valor);
      case 'porcentaje':
        return `${this.valor.toFixed(2)}%`;
      default:
        return new Intl.NumberFormat('es-SV', { maximumFractionDigits: 2 }).format(this.valor);
    }
  }
}
