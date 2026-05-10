import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VpnService, ResultadoVPN } from '../../core/services/vpn.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { AiAnalysisService } from '../../core/services/ai-analysis.service';
import { VerdictBadgeComponent } from '../../shared/components/verdict-badge/verdict-badge.component';
import { CashFlowChartComponent } from '../../shared/components/cash-flow-chart/cash-flow-chart.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ErrorListComponent } from '../../shared/components/error-list/error-list.component';

@Component({
  selector: 'app-vpn',
  standalone: true,
  imports: [CommonModule, FormsModule, VerdictBadgeComponent, CashFlowChartComponent, TopbarComponent, ErrorListComponent],
  templateUrl: './vpn.component.html',
  styleUrl: './vpn.component.css'
})
export class VpnComponent {
  inversion = 0;
  tasa = 0;
  vidaUtil = 3;
  salvamento = 0;
  flujos: number[] = [0, 0, 0];

  resultado: ResultadoVPN | null = null;
  errores: string[] = [];
  analisis = '';
  analizando = false;

  constructor(
    private vpnService: VpnService,
    private pdfService: PdfExportService,
    private aiService: AiAnalysisService
  ) {}

  private validar(): boolean {
    this.errores = [];
    if (!this.inversion || this.inversion <= 0)
      this.errores.push('La inversión inicial debe ser mayor a $0.');
    if (!this.tasa || this.tasa <= 0)
      this.errores.push('La tasa de descuento debe ser mayor a 0%.');
    if (this.tasa > 100)
      this.errores.push('La tasa de descuento no puede superar 100%.');
    if (this.vidaUtil < 1)
      this.errores.push('La vida útil debe ser al menos 1 año.');
    if (this.flujos.every(f => f === 0))
      this.errores.push('Ingresa al menos un flujo de caja distinto de cero.');
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
    this.resultado = this.vpnService.calcular(this.inversion, this.tasa, this.flujos, this.salvamento);
    this.analisis = '';
    this.analizando = true;
    const datos = { inversion: this.inversion, tasa: this.tasa, vidaUtil: this.vidaUtil, flujos: this.flujos, salvamento: this.salvamento };
    this.aiService.analizarVPN(datos, this.resultado).subscribe(texto => {
      this.analisis = texto;
      this.analizando = false;
    });
  }

  cargarEjemplo(): void {
    this.inversion = 50000;
    this.tasa = 12;
    this.vidaUtil = 5;
    this.salvamento = 8000;
    this.flujos = [15000, 18000, 20000, 22000, 25000];
    this.resultado = null;
    this.errores = [];
  }

  limpiar(): void {
    this.inversion = 0;
    this.tasa = 0;
    this.vidaUtil = 3;
    this.salvamento = 0;
    this.flujos = [0, 0, 0];
    this.resultado = null;
    this.errores = [];
    this.analisis = '';
    this.analizando = false;
  }

  exportarPDF(): void {
    if (!this.resultado) return;
    this.pdfService.exportarVPN(
      { inversion: this.inversion, tasa: this.tasa, vidaUtil: this.vidaUtil, flujos: this.flujos, salvamento: this.salvamento },
      this.resultado,
      this.analisis
    );
  }

  trackByIndex = (i: number) => i;
}
