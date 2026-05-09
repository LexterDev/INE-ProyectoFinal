import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TirService, ResultadoTIR } from '../../core/services/tir.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { AiAnalysisService } from '../../core/services/ai-analysis.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { VerdictBadgeComponent } from '../../shared/components/verdict-badge/verdict-badge.component';
import { CashFlowChartComponent } from '../../shared/components/cash-flow-chart/cash-flow-chart.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ErrorListComponent } from '../../shared/components/error-list/error-list.component';

@Component({
  selector: 'app-tir',
  standalone: true,
  imports: [CommonModule, FormsModule, MetricCardComponent, VerdictBadgeComponent, CashFlowChartComponent, TopbarComponent, ErrorListComponent],
  templateUrl: './tir.component.html',
  styleUrl: './tir.component.css'
})
export class TirComponent {
  inversion = 0;
  vidaUtil = 3;
  salvamento = 0;
  tmar = 0;
  flujos: number[] = [0, 0, 0];

  resultado: ResultadoTIR | null = null;
  errores: string[] = [];
  analisis = '';
  analizando = false;

  constructor(
    private tirService: TirService,
    private pdfService: PdfExportService,
    private aiService: AiAnalysisService
  ) {}

  private validar(): boolean {
    this.errores = [];
    if (!this.inversion || this.inversion <= 0)
      this.errores.push('La inversión inicial debe ser mayor a $0.');
    if (this.tmar < 0)
      this.errores.push('La TMAR debe ser un valor positivo o cero.');
    if (this.vidaUtil < 1)
      this.errores.push('La vida útil debe ser al menos 1 año.');
    if (this.flujos.every(f => f <= 0))
      this.errores.push('Debe haber al menos un flujo de caja positivo para calcular la TIR.');
    return this.errores.length === 0;
  }

  onVidaUtilChange(): void {
    const n = Math.max(1, Math.min(50, this.vidaUtil));
    this.vidaUtil = n;
    const actual = this.flujos.length;
    if (n > actual) {
      this.flujos = [...this.flujos, ...Array(n - actual).fill(0)];
    } else {
      this.flujos = this.flujos.slice(0, n);
    }
    this.resultado = null;
    this.errores = [];
  }

  calcular(): void {
    if (!this.validar()) return;
    this.resultado = this.tirService.calcular(this.inversion, this.flujos, this.salvamento, this.tmar);
    this.analisis = '';
    this.analizando = true;
    const datos = { inversion: this.inversion, tmar: this.tmar, vidaUtil: this.vidaUtil, flujos: this.flujos, salvamento: this.salvamento };
    this.aiService.analizarTIR(datos, this.resultado).subscribe(texto => {
      this.analisis = texto;
      this.analizando = false;
    });
  }

  cargarEjemplo(): void {
    this.inversion = 40000;
    this.vidaUtil = 4;
    this.salvamento = 5000;
    this.tmar = 15;
    this.flujos = [14000, 16000, 18000, 20000];
    this.resultado = null;
    this.errores = [];
  }

  limpiar(): void {
    this.inversion = 0;
    this.vidaUtil = 3;
    this.salvamento = 0;
    this.tmar = 0;
    this.flujos = [0, 0, 0];
    this.resultado = null;
    this.errores = [];
    this.analisis = '';
    this.analizando = false;
  }

  exportarPDF(): void {
    if (!this.resultado) return;
    this.pdfService.exportarTIR(
      { inversion: this.inversion, tmar: this.tmar, vidaUtil: this.vidaUtil, flujos: this.flujos, salvamento: this.salvamento },
      this.resultado,
      this.analisis
    );
  }

  trackByIndex = (i: number) => i;
}
