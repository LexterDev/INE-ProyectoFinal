import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VpnService, ResultadoVPN } from '../../core/services/vpn.service';
import { CaeService, ResultadoCAE } from '../../core/services/cae.service';
import { TirService, ResultadoTIR } from '../../core/services/tir.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { AiAnalysisService } from '../../core/services/ai-analysis.service';
import { VerdictBadgeComponent } from '../../shared/components/verdict-badge/verdict-badge.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ErrorListComponent } from '../../shared/components/error-list/error-list.component';

type Metodo = 'vpn' | 'cae' | 'tir';

export const ALT_LABELS = ['A', 'B', 'C', 'D'];
const MAX_ALTS = 4;
const MIN_ALTS = 2;

interface AlternativaVPN { inversion: number; tasa: number; vidaUtil: number; salvamento: number; flujos: number[]; }
interface AlternativaCAE { costoInicial: number; tasa: number; anios: number; costosOperacion: number; salvamento: number; }
interface AlternativaTIR { inversion: number; vidaUtil: number; salvamento: number; tmar: number; flujos: number[]; }

const newVPN = (): AlternativaVPN => ({ inversion: 0, tasa: 0, vidaUtil: 3, salvamento: 0, flujos: [0, 0, 0] });
const newCAE = (): AlternativaCAE => ({ costoInicial: 0, tasa: 0, anios: 5, costosOperacion: 0, salvamento: 0 });
const newTIR = (): AlternativaTIR => ({ inversion: 0, vidaUtil: 3, salvamento: 0, tmar: 0, flujos: [0, 0, 0] });

@Component({
  selector: 'app-comparacion',
  standalone: true,
  imports: [CommonModule, FormsModule, VerdictBadgeComponent, TopbarComponent, ErrorListComponent],
  templateUrl: './comparacion.component.html',
  styleUrl: './comparacion.component.css'
})
export class ComparacionComponent implements OnInit {
  metodo: Metodo = 'vpn';
  readonly LABELS = ALT_LABELS;
  readonly MAX_ALTS = MAX_ALTS;
  readonly MIN_ALTS = MIN_ALTS;

  // ── Estado VPN ────────────────────────────────────────────
  vpnAlts: AlternativaVPN[] = [newVPN(), newVPN()];
  resVpn: (ResultadoVPN | null)[] = [null, null];
  ganadorIdxVpn: number | null = null;
  analisisVpn = '';
  analizandoVpn = false;
  erroresVpn: string[] = [];

  // ── Estado CAE ────────────────────────────────────────────
  caeAlts: AlternativaCAE[] = [newCAE(), newCAE()];
  resCae: (ResultadoCAE | null)[] = [null, null];
  ganadorIdxCae: number | null = null;
  analisisCAE = '';
  analizandoCAE = false;
  erroresCAE: string[] = [];

  // ── Estado TIR ────────────────────────────────────────────
  tirAlts: AlternativaTIR[] = [newTIR(), newTIR()];
  resTir: (ResultadoTIR | null)[] = [null, null];
  ganadorIdxTir: number | null = null;
  analisisTir = '';
  analizandoTir = false;
  erroresTir: string[] = [];

  // ── Situación empresarial (global) ────────────────────────
  situacion = '';

  constructor(
    private vpnService: VpnService,
    private caeService: CaeService,
    private tirService: TirService,
    private pdfService: PdfExportService,
    private aiService: AiAnalysisService
  ) {}

  ngOnInit(): void {
    this.loadFromStorage();
  }

  // ── Getters del método activo ─────────────────────────────

  get numAlts(): number {
    if (this.metodo === 'vpn') return this.vpnAlts.length;
    if (this.metodo === 'cae') return this.caeAlts.length;
    return this.tirAlts.length;
  }

  get ganadorIdx(): number | null {
    if (this.metodo === 'vpn') return this.ganadorIdxVpn;
    if (this.metodo === 'cae') return this.ganadorIdxCae;
    return this.ganadorIdxTir;
  }

  get hasResultados(): boolean { return this.ganadorIdx !== null; }

  get ganadorLabel(): string {
    if (this.ganadorIdx === null || this.ganadorIdx === -1) return '';
    return ALT_LABELS[this.ganadorIdx];
  }

  get analisis(): string {
    if (this.metodo === 'vpn') return this.analisisVpn;
    if (this.metodo === 'cae') return this.analisisCAE;
    return this.analisisTir;
  }

  get analizando(): boolean {
    if (this.metodo === 'vpn') return this.analizandoVpn;
    if (this.metodo === 'cae') return this.analizandoCAE;
    return this.analizandoTir;
  }

  get errores(): string[] {
    if (this.metodo === 'vpn') return this.erroresVpn;
    if (this.metodo === 'cae') return this.erroresCAE;
    return this.erroresTir;
  }

  get gridClass(): string {
    const n = this.numAlts;
    if (n === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    if (n === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-4';
    return 'grid grid-cols-2 md:grid-cols-4 gap-4';
  }

  get metodosCompletados(): Metodo[] {
    const r: Metodo[] = [];
    if (this.ganadorIdxVpn !== null) r.push('vpn');
    if (this.ganadorIdxCae !== null) r.push('cae');
    if (this.ganadorIdxTir !== null) r.push('tir');
    return r;
  }

  // ── localStorage ──────────────────────────────────────────

  private saveToStorage(m: Metodo): void {
    try {
      let data: any;
      if (m === 'vpn') {
        data = { alts: this.vpnAlts, resultados: this.resVpn, ganadorIdx: this.ganadorIdxVpn, analisis: this.analisisVpn };
      } else if (m === 'cae') {
        data = { alts: this.caeAlts, resultados: this.resCae, ganadorIdx: this.ganadorIdxCae, analisis: this.analisisCAE };
      } else {
        data = { alts: this.tirAlts, resultados: this.resTir, ganadorIdx: this.ganadorIdxTir, analisis: this.analisisTir };
      }
      localStorage.setItem(`ine_comp_${m}`, JSON.stringify(data));
    } catch { /* storage lleno o no disponible */ }
  }

  saveSituacion(): void {
    try { localStorage.setItem('ine_comp_situacion', this.situacion); } catch {}
  }

  private loadFromStorage(): void {
    try {
      const rawSit = localStorage.getItem('ine_comp_situacion');
      if (rawSit !== null) this.situacion = rawSit;
    } catch {}

    (['vpn', 'cae', 'tir'] as Metodo[]).forEach(m => {
      try {
        const raw = localStorage.getItem(`ine_comp_${m}`);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (m === 'vpn') {
          if (d.alts?.length >= MIN_ALTS) this.vpnAlts = d.alts;
          if (d.resultados?.length) this.resVpn = d.resultados;
          this.ganadorIdxVpn = d.ganadorIdx ?? null;
          this.analisisVpn = d.analisis ?? '';
        } else if (m === 'cae') {
          if (d.alts?.length >= MIN_ALTS) this.caeAlts = d.alts;
          if (d.resultados?.length) this.resCae = d.resultados;
          this.ganadorIdxCae = d.ganadorIdx ?? null;
          this.analisisCAE = d.analisis ?? '';
        } else {
          if (d.alts?.length >= MIN_ALTS) this.tirAlts = d.alts;
          if (d.resultados?.length) this.resTir = d.resultados;
          this.ganadorIdxTir = d.ganadorIdx ?? null;
          this.analisisTir = d.analisis ?? '';
        }
      } catch { /* JSON inválido */ }
    });
  }

  private clearStorage(m: Metodo): void {
    try { localStorage.removeItem(`ine_comp_${m}`); } catch {}
  }

  // ── Acciones ──────────────────────────────────────────────

  agregarAlternativa(): void {
    if (this.numAlts >= MAX_ALTS) return;
    if (this.metodo === 'vpn') {
      this.vpnAlts = [...this.vpnAlts, newVPN()];
      this.resVpn = [...this.resVpn, null];
    } else if (this.metodo === 'cae') {
      this.caeAlts = [...this.caeAlts, newCAE()];
      this.resCae = [...this.resCae, null];
    } else {
      this.tirAlts = [...this.tirAlts, newTIR()];
      this.resTir = [...this.resTir, null];
    }
    if (this.metodo === 'vpn') { this.ganadorIdxVpn = null; this.erroresVpn = []; }
    else if (this.metodo === 'cae') { this.ganadorIdxCae = null; this.erroresCAE = []; }
    else { this.ganadorIdxTir = null; this.erroresTir = []; }
  }

  eliminarAlternativa(i: number): void {
    if (this.numAlts <= MIN_ALTS) return;
    if (this.metodo === 'vpn') {
      this.vpnAlts = this.vpnAlts.filter((_, idx) => idx !== i);
      this.resVpn = this.resVpn.filter((_, idx) => idx !== i);
      this.ganadorIdxVpn = null; this.erroresVpn = [];
    } else if (this.metodo === 'cae') {
      this.caeAlts = this.caeAlts.filter((_, idx) => idx !== i);
      this.resCae = this.resCae.filter((_, idx) => idx !== i);
      this.ganadorIdxCae = null; this.erroresCAE = [];
    } else {
      this.tirAlts = this.tirAlts.filter((_, idx) => idx !== i);
      this.resTir = this.resTir.filter((_, idx) => idx !== i);
      this.ganadorIdxTir = null; this.erroresTir = [];
    }
  }

  onVidaUtilChange(alt: AlternativaVPN | AlternativaTIR): void {
    const n = Math.max(1, Math.min(50, alt.vidaUtil));
    alt.vidaUtil = n;
    const actual = alt.flujos.length;
    if (n > actual) alt.flujos = [...alt.flujos, ...Array(n - actual).fill(0)];
    else alt.flujos = alt.flujos.slice(0, n);
  }

  private validarVPN(alt: AlternativaVPN, label: string): string[] {
    const e: string[] = [];
    if (alt.inversion <= 0) e.push(`Alternativa ${label}: la inversión debe ser mayor a $0.`);
    if (alt.tasa <= 0)      e.push(`Alternativa ${label}: la tasa de descuento debe ser mayor a 0%.`);
    if (alt.tasa > 100)     e.push(`Alternativa ${label}: la tasa no puede superar 100%.`);
    if (alt.flujos.every(f => f === 0)) e.push(`Alternativa ${label}: ingresa al menos un flujo distinto de cero.`);
    return e;
  }

  private validarCAE(alt: AlternativaCAE, label: string): string[] {
    const e: string[] = [];
    if (alt.costoInicial <= 0) e.push(`Alternativa ${label}: el costo inicial debe ser mayor a $0.`);
    if (alt.tasa <= 0)         e.push(`Alternativa ${label}: la tasa de descuento debe ser mayor a 0%.`);
    if (alt.tasa > 100)        e.push(`Alternativa ${label}: la tasa no puede superar 100%.`);
    if (alt.anios < 1)         e.push(`Alternativa ${label}: la vida útil debe ser al menos 1 año.`);
    return e;
  }

  private validarTIR(alt: AlternativaTIR, label: string): string[] {
    const e: string[] = [];
    if (alt.inversion <= 0)            e.push(`Alternativa ${label}: la inversión debe ser mayor a $0.`);
    if (alt.tmar < 0)                  e.push(`Alternativa ${label}: la TMAR debe ser un valor positivo.`);
    if (alt.flujos.every(f => f <= 0)) e.push(`Alternativa ${label}: debe haber al menos un flujo positivo.`);
    return e;
  }

  private validar(): boolean {
    if (this.metodo === 'vpn') {
      this.erroresVpn = this.vpnAlts.flatMap((a, i) => this.validarVPN(a, ALT_LABELS[i]));
      return this.erroresVpn.length === 0;
    } else if (this.metodo === 'cae') {
      this.erroresCAE = this.caeAlts.flatMap((a, i) => this.validarCAE(a, ALT_LABELS[i]));
      return this.erroresCAE.length === 0;
    } else {
      this.erroresTir = this.tirAlts.flatMap((a, i) => this.validarTIR(a, ALT_LABELS[i]));
      return this.erroresTir.length === 0;
    }
  }

  calcular(): void {
    if (!this.validar()) return;

    if (this.metodo === 'vpn') {
      this.resVpn = this.vpnAlts.map(a =>
        this.vpnService.calcular(a.inversion, a.tasa, a.flujos, a.salvamento)
      );
      const vals = (this.resVpn as ResultadoVPN[]).map(r => r.vpn);
      const maxVal = Math.max(...vals);
      this.ganadorIdxVpn = vals.filter(v => v === maxVal).length > 1 ? -1 : vals.indexOf(maxVal);
      this.analisisVpn = '';
      this.analizandoVpn = true;
      this.saveToStorage('vpn');
      this.aiService.analizarComparacionVPN(this.vpnAlts, this.resVpn as ResultadoVPN[], this.ganadorIdxVpn)
        .subscribe(t => { this.analisisVpn = t; this.analizandoVpn = false; this.saveToStorage('vpn'); });

    } else if (this.metodo === 'cae') {
      this.resCae = this.caeAlts.map(a =>
        this.caeService.calcular(a.costoInicial, a.tasa, a.anios, a.costosOperacion, a.salvamento)
      );
      const vals = (this.resCae as ResultadoCAE[]).map(r => r.cae);
      const minVal = Math.min(...vals);
      this.ganadorIdxCae = vals.filter(v => v === minVal).length > 1 ? -1 : vals.indexOf(minVal);
      this.analisisCAE = '';
      this.analizandoCAE = true;
      this.saveToStorage('cae');
      this.aiService.analizarComparacionCAE(this.caeAlts, this.resCae as ResultadoCAE[], this.ganadorIdxCae)
        .subscribe(t => { this.analisisCAE = t; this.analizandoCAE = false; this.saveToStorage('cae'); });

    } else {
      this.resTir = this.tirAlts.map(a =>
        this.tirService.calcular(a.inversion, a.flujos, a.salvamento, a.tmar)
      );
      const vals = (this.resTir as ResultadoTIR[]).map(r => r.tir);
      const maxVal = Math.max(...vals);
      this.ganadorIdxTir = vals.filter(v => v === maxVal).length > 1 ? -1 : vals.indexOf(maxVal);
      this.analisisTir = '';
      this.analizandoTir = true;
      this.saveToStorage('tir');
      this.aiService.analizarComparacionTIR(this.tirAlts, this.resTir as ResultadoTIR[], this.ganadorIdxTir)
        .subscribe(t => { this.analisisTir = t; this.analizandoTir = false; this.saveToStorage('tir'); });
    }
  }

  cargarEjemplo(): void {
    if (this.metodo === 'vpn') {
      this.vpnAlts = [
        { inversion: 50000, tasa: 12, vidaUtil: 5, salvamento: 8000, flujos: [15000, 18000, 20000, 22000, 25000] },
        { inversion: 65000, tasa: 12, vidaUtil: 5, salvamento: 12000, flujos: [20000, 22000, 25000, 27000, 30000] }
      ];
      this.resVpn = [null, null]; this.ganadorIdxVpn = null;
      this.analisisVpn = ''; this.analizandoVpn = false; this.erroresVpn = [];
    } else if (this.metodo === 'cae') {
      this.caeAlts = [
        { costoInicial: 80000, tasa: 10, anios: 8, costosOperacion: 12000, salvamento: 10000 },
        { costoInicial: 55000, tasa: 10, anios: 5, costosOperacion: 18000, salvamento: 5000 }
      ];
      this.resCae = [null, null]; this.ganadorIdxCae = null;
      this.analisisCAE = ''; this.analizandoCAE = false; this.erroresCAE = [];
    } else {
      this.tirAlts = [
        { inversion: 40000, vidaUtil: 4, salvamento: 5000, tmar: 15, flujos: [14000, 16000, 18000, 20000] },
        { inversion: 60000, vidaUtil: 5, salvamento: 8000, tmar: 15, flujos: [18000, 20000, 22000, 24000, 26000] }
      ];
      this.resTir = [null, null]; this.ganadorIdxTir = null;
      this.analisisTir = ''; this.analizandoTir = false; this.erroresTir = [];
    }
  }

  limpiar(): void {
    if (this.metodo === 'vpn') {
      this.vpnAlts = [newVPN(), newVPN()]; this.resVpn = [null, null];
      this.ganadorIdxVpn = null; this.analisisVpn = ''; this.analizandoVpn = false; this.erroresVpn = [];
    } else if (this.metodo === 'cae') {
      this.caeAlts = [newCAE(), newCAE()]; this.resCae = [null, null];
      this.ganadorIdxCae = null; this.analisisCAE = ''; this.analizandoCAE = false; this.erroresCAE = [];
    } else {
      this.tirAlts = [newTIR(), newTIR()]; this.resTir = [null, null];
      this.ganadorIdxTir = null; this.analisisTir = ''; this.analizandoTir = false; this.erroresTir = [];
    }
    this.clearStorage(this.metodo);
  }

  exportarPDF(): void {
    if (this.metodo === 'vpn' && this.ganadorIdxVpn !== null && this.resVpn.every(r => r !== null)) {
      this.pdfService.exportarComparacion('vpn', this.vpnAlts, this.resVpn as ResultadoVPN[], this.ganadorIdxVpn, this.analisisVpn, this.situacion);
    } else if (this.metodo === 'cae' && this.ganadorIdxCae !== null && this.resCae.every(r => r !== null)) {
      this.pdfService.exportarComparacion('cae', this.caeAlts, this.resCae as ResultadoCAE[], this.ganadorIdxCae, this.analisisCAE, this.situacion);
    } else if (this.metodo === 'tir' && this.ganadorIdxTir !== null && this.resTir.every(r => r !== null)) {
      this.pdfService.exportarComparacion('tir', this.tirAlts, this.resTir as ResultadoTIR[], this.ganadorIdxTir, this.analisisTir, this.situacion);
    }
  }

  exportarReporteCompleto(): void {
    const secciones: any[] = [];
    if (this.ganadorIdxVpn !== null && this.resVpn.every(r => r !== null))
      secciones.push({ metodo: 'vpn', alts: this.vpnAlts, resultados: this.resVpn, ganadorIdx: this.ganadorIdxVpn, analisis: this.analisisVpn });
    if (this.ganadorIdxCae !== null && this.resCae.every(r => r !== null))
      secciones.push({ metodo: 'cae', alts: this.caeAlts, resultados: this.resCae, ganadorIdx: this.ganadorIdxCae, analisis: this.analisisCAE });
    if (this.ganadorIdxTir !== null && this.resTir.every(r => r !== null))
      secciones.push({ metodo: 'tir', alts: this.tirAlts, resultados: this.resTir, ganadorIdx: this.ganadorIdxTir, analisis: this.analisisTir });
    if (secciones.length > 0) this.pdfService.exportarReporteCompleto(secciones, this.situacion);
  }

  trackByIndex = (i: number) => i;
}
