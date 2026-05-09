import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-verdict-badge',
  standalone: true,
  imports: [],
  templateUrl: './verdict-badge.component.html',
  styles: ``
})
export class VerdictBadgeComponent {
  @Input() veredicto: 'ACEPTADO' | 'RECHAZADO' | 'INDIFERENTE' = 'INDIFERENTE';

  get clases(): string {
    switch (this.veredicto) {
      case 'ACEPTADO':    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'RECHAZADO':   return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'INDIFERENTE': return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  }

  get icono(): string {
    switch (this.veredicto) {
      case 'ACEPTADO':    return '✓';
      case 'RECHAZADO':   return '✗';
      case 'INDIFERENTE': return '~';
    }
  }
}
