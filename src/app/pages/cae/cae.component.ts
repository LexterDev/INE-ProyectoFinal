import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaeService, ResultadoCAE } from '../../core/services/cae.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { AiAnalysisService } from '../../core/services/ai-analysis.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ErrorListComponent } from '../../shared/components/error-list/error-list.component';

@Component({
  selector: 'app-cae',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent, ErrorListComponent],
  templateUrl: './cae.component.html',
  styleUrl: './cae.component.css'
})
export class CaeComponent {
  costoInicial = 0;
  tasa = 0;
  anios = 5;
  costosOperacion = 0;
  salvamento = 0;

  resultado: ResultadoCAE | null = null;
  errores: string[] = [];
  analisis = '';
  analizando = false;

  constructor(
    private caeService: CaeService,
    private pdfService: PdfExportService,
    private aiService: AiAnalysisService
  ) {}

  private validar(): boolean {
    this.errores = [];
    if (!this.costoInicial || this.costoInicial <= 0)
      this.errores.push('El costo inicial debe ser mayor a $0.');
    if (!this.tasa || this.tasa <= 0)
      this.errores.push('La tasa de descuento debe ser mayor a 0%.');
    if (this.tasa > 100)
      this.errores.push('La tasa de descuento no puede superar 100%.');
    if (this.anios < 1)
      this.errores.push('La vida útil debe ser al menos 1 año.');
    return this.errores.length === 0;
  }

  calcular(): void {
    if (!this.validar()) return;
    this.resultado = this.caeService.calcular(
      this.costoInicial, this.tasa, this.anios, this.costosOperacion, this.salvamento
    );
    this.analisis = '';
    this.analizando = true;
    const datos = { costoInicial: this.costoInicial, tasa: this.tasa, anios: this.anios, costosOperacion: this.costosOperacion, salvamento: this.salvamento };
    this.aiService.analizarCAE(datos, this.resultado).subscribe(texto => {
      this.analisis = texto;
      this.analizando = false;
    });
  }

  cargarEjemplo(): void {
    this.costoInicial = 80000;
    this.tasa = 10;
    this.anios = 8;
    this.costosOperacion = 12000;
    this.salvamento = 10000;
    this.resultado = null;
    this.errores = [];
  }

  limpiar(): void {
    this.costoInicial = 0;
    this.tasa = 0;
    this.anios = 5;
    this.costosOperacion = 0;
    this.salvamento = 0;
    this.resultado = null;
    this.errores = [];
    this.analisis = '';
    this.analizando = false;
  }

  exportarPDF(): void {
    if (!this.resultado) return;
    this.pdfService.exportarCAE(
      { costoInicial: this.costoInicial, tasa: this.tasa, anios: this.anios, costosOperacion: this.costosOperacion, salvamento: this.salvamento },
      this.resultado,
      this.analisis
    );
  }
}
