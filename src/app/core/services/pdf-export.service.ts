import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResultadoVPN } from './vpn.service';
import { ResultadoCAE } from './cae.service';
import { ResultadoTIR } from './tir.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

const LABELS = ['A', 'B', 'C', 'D'];
const USD  = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(n);
const PCT  = (n: number) => `${n.toFixed(4)}%`;
const FECHA = () => new Date().toLocaleDateString('es-SV', { dateStyle: 'long' });

const INDIGO  = [99, 102, 241] as [number, number, number];
const DARK    = [15, 23, 42]   as [number, number, number];
const SUCCESS = [16, 185, 129] as [number, number, number];
const DANGER  = [244, 63, 94]  as [number, number, number];
const NEUTRAL = [100, 116, 139] as [number, number, number];
const WHITE   = [255, 255, 255] as [number, number, number];
const LIGHT   = [248, 250, 252] as [number, number, number];

// ─── Header ─────────────────────────────────────────────────────────────────

function dibujarHeader(doc: jsPDF, metodo: string): number {
  // Barra superior oscura
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 28, 'F');

  // Acento izquierdo
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, 5, 28, 'F');

  // Logo text
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INE App', 12, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...NEUTRAL);
  doc.text('Sistema de Evaluación de Alternativas Económicas', 12, 17);
  doc.text(`Fecha: ${FECHA()}`, 12, 23);

  // Nombre del método (derecha)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text(metodo, 200, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...NEUTRAL);
  doc.text('INE 135 · Ciclo I/2026', 200, 17, { align: 'right' });
  doc.text('UES · Facultad Multidisciplinaria de Occidente', 200, 23, { align: 'right' });

  return 36; // y inicial del contenido
}

function dibujarAnalisis(doc: jsPDF, analisis: string, y: number): void {
  if (!analisis) return;
  doc.setFillColor(...INDIGO);
  doc.rect(10, y, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('ANÁLISIS DEL RESULTADO', 16, y + 4.5);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const lineas = doc.splitTextToSize(analisis, 185);
  doc.text(lineas, 10, y);
}

function dibujarFooter(doc: jsPDF): void {
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...LIGHT);
  doc.rect(0, pageH - 12, 210, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, pageH - 12, 210, pageH - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...NEUTRAL);
  doc.text('INE App · SEAE · INE 135 · Ciclo I/2026 · Universidad de El Salvador · Occidente', 105, pageH - 5, { align: 'center' });
}

function seccion(doc: jsPDF, titulo: string, y: number): number {
  doc.setFillColor(...INDIGO);
  doc.rect(10, y, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(titulo.toUpperCase(), 16, y + 4.5);
  return y + 10;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface DatosVPN {
  inversion: number;
  tasa: number;
  vidaUtil: number;
  flujos: number[];
  salvamento: number;
}

export interface DatosCAE {
  costoInicial: number;
  tasa: number;
  anios: number;
  costosOperacion: number;
  salvamento: number;
}

export interface DatosTIR {
  inversion: number;
  tmar: number;
  vidaUtil: number;
  flujos: number[];
  salvamento: number;
}

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  exportarVPN(datos: DatosVPN, resultado: ResultadoVPN, analisis = ''): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = dibujarHeader(doc, 'Valor Presente Neto (VPN)');

    // ── Datos de entrada ──
    y = seccion(doc, 'Datos de entrada', y);
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: [{ header: 'Parámetro', dataKey: 'param' }, { header: 'Valor', dataKey: 'val' }],
      body: [
        { param: 'Inversión inicial',   val: USD(datos.inversion) },
        { param: 'Tasa de descuento',   val: `${datos.tasa}%` },
        { param: 'Vida útil',           val: `${datos.vidaUtil} años` },
        { param: 'Valor de salvamento', val: USD(datos.salvamento) },
      ],
      columnStyles: { param: { cellWidth: 80 }, val: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Tabla de flujos de caja
    const i = datos.tasa / 100;
    const filasFlujoss = datos.flujos.map((f, t) => ({
      año:  String(t + 1),
      flujo: USD(f),
      vp:   USD(f / Math.pow(1 + i, t + 1)),
    }));
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 82, 192] as [number,number,number], textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: [
        { header: 'Año',             dataKey: 'año' },
        { header: 'Flujo de Caja',   dataKey: 'flujo' },
        { header: 'Valor Presente',  dataKey: 'vp' },
      ],
      body: filasFlujoss,
      columnStyles: { año: { halign: 'center', cellWidth: 20 }, flujo: { halign: 'right' }, vp: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Resultados ──
    y = seccion(doc, 'Resultados', y);
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: [{ header: 'Indicador', dataKey: 'ind' }, { header: 'Monto', dataKey: 'monto' }],
      body: [
        { ind: 'VP de Ingresos (flujos + salvamento)', monto: USD(resultado.vpIngresos) },
        { ind: 'Inversión Inicial',                    monto: USD(resultado.inversion) },
        { ind: 'Valor Presente Neto (VPN)',             monto: USD(resultado.vpn) },
      ],
      columnStyles: {
        ind:   { cellWidth: 110 },
        monto: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.dataKey === 'monto' && data.row.index === 2) {
          const color = resultado.veredicto === 'ACEPTADO' ? SUCCESS : resultado.veredicto === 'RECHAZADO' ? DANGER : NEUTRAL;
          data.cell.styles.textColor = color;
          data.cell.styles.fontSize = 11;
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Veredicto ──
    y = this.dibujarVeredictoVPN(doc, resultado, y);

    y += 4;
    dibujarAnalisis(doc, analisis, y);
    dibujarFooter(doc);
    doc.save(`INE_VPN_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // ─────────────────────────────────────────────────────────

  exportarCAE(datos: DatosCAE, resultado: ResultadoCAE, analisis = ''): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = dibujarHeader(doc, 'Costo Anual Equivalente (CAE)');

    y = seccion(doc, 'Datos de entrada', y);
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: [{ header: 'Parámetro', dataKey: 'param' }, { header: 'Valor', dataKey: 'val' }],
      body: [
        { param: 'Costo inicial',                 val: USD(datos.costoInicial) },
        { param: 'Tasa de descuento',              val: `${datos.tasa}%` },
        { param: 'Vida útil',                      val: `${datos.anios} años` },
        { param: 'Costos de operación anuales',    val: USD(datos.costosOperacion) },
        { param: 'Valor de salvamento',            val: USD(datos.salvamento) },
      ],
      columnStyles: { param: { cellWidth: 90 }, val: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    y = seccion(doc, 'Resultados', y);
    const factor = (datos.tasa / 100 * Math.pow(1 + datos.tasa / 100, datos.anios)) /
                   (Math.pow(1 + datos.tasa / 100, datos.anios) - 1);
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: [{ header: 'Indicador', dataKey: 'ind' }, { header: 'Valor', dataKey: 'val' }],
      body: [
        { ind: 'Factor de recuperación de capital',  val: factor.toFixed(6) },
        { ind: 'VP del Valor de Salvamento',         val: USD(resultado.vpSalvamento) },
        { ind: 'Costos de Operación Anuales',        val: USD(datos.costosOperacion) },
        { ind: 'Costo Anual Equivalente (CAE)',       val: USD(resultado.cae) },
      ],
      columnStyles: {
        ind: { cellWidth: 110 },
        val: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.dataKey === 'val' && data.row.index === 3) {
          data.cell.styles.textColor = INDIGO;
          data.cell.styles.fontSize = 11;
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    y = seccion(doc, 'Criterio de decisión', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const texto = `CAE = ${USD(resultado.cae)} por año. Al comparar alternativas, se selecciona la que presente el MENOR Costo Anual Equivalente, ya que representa el menor desembolso anual uniforme para el inversionista.`;
    const lineas = doc.splitTextToSize(texto, 185);
    doc.text(lineas, 10, y);

    y += 4;
    dibujarAnalisis(doc, analisis, y);
    dibujarFooter(doc);
    doc.save(`INE_CAE_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // ─────────────────────────────────────────────────────────

  exportarTIR(datos: DatosTIR, resultado: ResultadoTIR, analisis = ''): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = dibujarHeader(doc, 'Tasa Interna de Retorno (TIR)');

    y = seccion(doc, 'Datos de entrada', y);
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: [{ header: 'Parámetro', dataKey: 'param' }, { header: 'Valor', dataKey: 'val' }],
      body: [
        { param: 'Inversión inicial',       val: USD(datos.inversion) },
        { param: 'TMAR',                    val: `${datos.tmar}%` },
        { param: 'Vida útil',               val: `${datos.vidaUtil} años` },
        { param: 'Valor de salvamento',     val: USD(datos.salvamento) },
      ],
      columnStyles: { param: { cellWidth: 80 }, val: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Tabla de flujos
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 82, 192] as [number,number,number], textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: [
        { header: 'Año',           dataKey: 'año' },
        { header: 'Flujo de Caja', dataKey: 'flujo' },
      ],
      body: datos.flujos.map((f, t) => ({ año: String(t + 1), flujo: USD(f) })),
      columnStyles: { año: { halign: 'center', cellWidth: 20 }, flujo: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    y = seccion(doc, 'Resultados', y);
    const aceptado = resultado.veredicto === 'ACEPTADO';
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: [{ header: 'Indicador', dataKey: 'ind' }, { header: 'Valor', dataKey: 'val' }],
      body: [
        { ind: 'TMAR (Tasa mínima aceptable de rendimiento)', val: PCT(resultado.tmar) },
        { ind: 'TIR calculada (método de bisección)',         val: PCT(resultado.tir) },
        { ind: 'Diferencia TIR − TMAR',                      val: PCT(resultado.tir - resultado.tmar) },
      ],
      columnStyles: {
        ind: { cellWidth: 120 },
        val: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.dataKey === 'val' && data.row.index === 1) {
          data.cell.styles.textColor = aceptado ? SUCCESS : DANGER;
          data.cell.styles.fontSize = 11;
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Veredicto
    y = this.dibujarVeredictoTIR(doc, resultado, y);

    y += 4;
    dibujarAnalisis(doc, analisis, y);
    dibujarFooter(doc);
    doc.save(`INE_TIR_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // ─────────────────────────────────────────────────────────

  // ─── Builder interno reutilizable ────────────────────────────────────────────

  private buildSeccionComparacion(
    doc: jsPDF,
    metodo: 'vpn' | 'cae' | 'tir',
    alts: any[],
    resultados: any[],
    ganadorIdx: number,
    analisis: string,
    y: number
  ): number {

    const cols = [
      { header: 'Parámetro', dataKey: 'p' },
      ...alts.map((_, i) => ({ header: `Alt. ${LABELS[i]}`, dataKey: `c${i}` }))
    ];

    function makeRow(label: string, values: string[]): Record<string, string> {
      const row: Record<string, string> = { p: label };
      values.forEach((v, i) => { row[`c${i}`] = v; });
      return row;
    }

    let body: Record<string, string>[] = [];
    let metricRowIndex = 0;

    if (metodo === 'vpn') {
      const vpnAlts = alts as DatosVPN[];
      const vpnRes  = resultados as ResultadoVPN[];
      body = [
        makeRow('Inversión inicial',  vpnAlts.map(a => USD(a.inversion))),
        makeRow('Tasa de descuento',  vpnAlts.map(a => `${a.tasa}%`)),
        makeRow('Vida útil',          vpnAlts.map(a => `${a.vidaUtil} años`)),
        makeRow('Salvamento',         vpnAlts.map(a => USD(a.salvamento))),
        makeRow('VP de Ingresos',     vpnRes.map(r => USD(r.vpIngresos))),
        makeRow('VPN',                vpnRes.map(r => USD(r.vpn))),
        makeRow('Veredicto',          vpnRes.map(r => r.veredicto)),
      ];
      metricRowIndex = 5;
    } else if (metodo === 'cae') {
      const caeAlts = alts as DatosCAE[];
      const caeRes  = resultados as ResultadoCAE[];
      body = [
        makeRow('Costo inicial',        caeAlts.map(a => USD(a.costoInicial))),
        makeRow('Tasa de descuento',     caeAlts.map(a => `${a.tasa}%`)),
        makeRow('Vida útil',             caeAlts.map(a => `${a.anios} años`)),
        makeRow('Costos de operación',   caeAlts.map(a => USD(a.costosOperacion))),
        makeRow('Salvamento',            caeAlts.map(a => USD(a.salvamento))),
        makeRow('VP Salvamento',         caeRes.map(r => USD(r.vpSalvamento))),
        makeRow('CAE',                   caeRes.map(r => `${USD(r.cae)}/año`)),
      ];
      metricRowIndex = 6;
    } else {
      const tirAlts = alts as DatosTIR[];
      const tirRes  = resultados as ResultadoTIR[];
      body = [
        makeRow('Inversión inicial',  tirAlts.map(a => USD(a.inversion))),
        makeRow('TMAR',               tirAlts.map(a => PCT(a.tmar))),
        makeRow('Vida útil',          tirAlts.map(a => `${a.vidaUtil} años`)),
        makeRow('Salvamento',         tirAlts.map(a => USD(a.salvamento))),
        makeRow('TIR calculada',      tirRes.map(r => PCT(r.tir))),
        makeRow('Veredicto',          tirRes.map(r => r.veredicto)),
      ];
      metricRowIndex = 4;
    }

    const pWidth = alts.length <= 2 ? 70 : alts.length === 3 ? 55 : 40;
    const colStyles: Record<string, any> = { p: { cellWidth: pWidth } };
    alts.forEach((_, i) => { colStyles[`c${i}`] = { halign: 'right' }; });

    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT },
      columns: cols,
      body,
      columnStyles: colStyles,
      didParseCell: (data) => {
        if (data.row.index === metricRowIndex && ganadorIdx >= 0) {
          const winKey = `c${ganadorIdx}`;
          data.cell.styles.textColor = data.column.dataKey === winKey ? SUCCESS : NEUTRAL;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize  = 10;
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    const pageH = doc.internal.pageSize.getHeight();
    const footerMargin = 20; // espacio reservado para el footer

    // ── Verificar espacio para el banner (~25mm) ──────────────────────────────
    if (y + 30 > pageH - footerMargin) {
      doc.addPage();
      y = 20;
    }

    y = this.dibujarBannerGanador(doc, ganadorIdx >= 0 ? LABELS[ganadorIdx] : '', metodo, y);
    y += 4;

    // ── Verificar espacio para la sección de análisis (~20mm mínimo) ──────────
    if (analisis) {
      const analisisLines = doc.splitTextToSize(analisis, 185).length;
      const analisisH = 12 + analisisLines * 5; // header(12) + líneas
      if (y + analisisH > pageH - footerMargin) {
        doc.addPage();
        y = 20;
      }
      dibujarAnalisis(doc, analisis, y);
      return y + analisisH + 8;
    }

    return y + 8;
  }

  // ── Exportar método individual ────────────────────────────────────────────

  exportarComparacion(
    metodo: 'vpn' | 'cae' | 'tir',
    alts: (DatosVPN | DatosCAE | DatosTIR)[],
    resultados: (ResultadoVPN | ResultadoCAE | ResultadoTIR)[],
    ganadorIdx: number,
    analisis = ''
  ): void {
    const nombreMetodo = metodo === 'vpn' ? 'Comparación VPN' : metodo === 'cae' ? 'Comparación CAE' : 'Comparación TIR';
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = dibujarHeader(doc, nombreMetodo);
    y = seccion(doc, 'Tabla comparativa de alternativas', y);
    this.buildSeccionComparacion(doc, metodo, alts, resultados, ganadorIdx, analisis, y);
    dibujarFooter(doc);
    doc.save(`INE_Comparacion_${metodo.toUpperCase()}_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // ── Exportar reporte completo (todos los métodos completados) ─────────────

  exportarReporteCompleto(secciones: Array<{
    metodo: 'vpn' | 'cae' | 'tir';
    alts: any[];
    resultados: any[];
    ganadorIdx: number;
    analisis: string;
  }>): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageH = doc.internal.pageSize.getHeight();
    let y = dibujarHeader(doc, 'Reporte Comparativo Completo');

    const footerMargin = 20;
    // Espacio mínimo necesario al inicio de una sección:
    // título seccion(~12) + cabecera tabla(~10) + al menos 2 filas(~20) = ~45mm
    const minSpaceForSection = 50;

    secciones.forEach((sec, idx) => {
      const nombreMetodo = sec.metodo === 'vpn' ? 'Comparación VPN' : sec.metodo === 'cae' ? 'Comparación CAE' : 'Comparación TIR';

      if (idx > 0) {
        // Si no hay suficiente espacio para comenzar la siguiente sección, nueva página
        if (y + minSpaceForSection > pageH - footerMargin) {
          doc.addPage();
          y = 20;
        } else {
          // Línea divisoria entre secciones
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.line(10, y, 200, y);
          y += 10;
        }
      }

      y = seccion(doc, nombreMetodo, y);
      y = this.buildSeccionComparacion(doc, sec.metodo, sec.alts, sec.resultados, sec.ganadorIdx, sec.analisis, y);
    });

    dibujarFooter(doc);
    doc.save(`INE_Reporte_Completo_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  private dibujarVeredictoVPN(doc: jsPDF, resultado: ResultadoVPN, y: number): number {
    const aceptado  = resultado.veredicto === 'ACEPTADO';
    const ind       = resultado.veredicto === 'INDIFERENTE';
    const color     = aceptado ? SUCCESS : ind ? NEUTRAL : DANGER;
    const texto     = aceptado
      ? `VPN = ${USD(resultado.vpn)} > 0 → El proyecto genera valor por encima de la tasa de descuento exigida. SE ACEPTA.`
      : ind
      ? `VPN = $0.00 → El proyecto recupera exactamente la inversión a la tasa requerida. INDIFERENTE.`
      : `VPN = ${USD(resultado.vpn)} < 0 → El proyecto destruye valor respecto al costo de oportunidad del capital. SE RECHAZA.`;

    doc.setFillColor(...color);
    doc.rect(10, y, 3, 14, 'F');
    doc.setFillColor(...color, 0.08);
    doc.rect(13, y, 187, 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(`Veredicto: ${resultado.veredicto}`, 17, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    const lineas = doc.splitTextToSize(texto, 178);
    doc.text(lineas, 17, y + 10);
    return y + 22;
  }

  private dibujarVeredictoTIR(doc: jsPDF, resultado: ResultadoTIR, y: number): number {
    const aceptado = resultado.veredicto === 'ACEPTADO';
    const color    = aceptado ? SUCCESS : DANGER;
    const texto    = aceptado
      ? `TIR = ${PCT(resultado.tir)} > TMAR = ${PCT(resultado.tmar)} → El proyecto rinde más que el costo de oportunidad del capital. SE ACEPTA.`
      : `TIR = ${PCT(resultado.tir)} < TMAR = ${PCT(resultado.tmar)} → El proyecto no supera la rentabilidad mínima requerida. SE RECHAZA.`;

    doc.setFillColor(...color);
    doc.rect(10, y, 3, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(`Veredicto: ${resultado.veredicto}`, 17, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    const lineas = doc.splitTextToSize(texto, 178);
    doc.text(lineas, 17, y + 10);
    return y + 22;
  }

  private dibujarBannerGanador(doc: jsPDF, ganadorLabel: string, metodo: string, y: number): number {
    if (!ganadorLabel) {
      doc.setFillColor(...NEUTRAL);
      doc.rect(10, y, 3, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...NEUTRAL);
      doc.text('Resultado: Empate — las alternativas son económicamente equivalentes.', 17, y + 7);
      return y + 18;
    }

    const criterio = metodo === 'vpn'
      ? 'mayor Valor Presente Neto positivo'
      : metodo === 'cae'
      ? 'menor Costo Anual Equivalente'
      : 'mayor Tasa Interna de Retorno (superando la TMAR)';

    doc.setFillColor(...SUCCESS);
    doc.rect(10, y, 3, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...SUCCESS);
    doc.text(`Alternativa ${ganadorLabel} — RECOMENDADA`, 17, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    const lineas = doc.splitTextToSize(`Seleccionada según el criterio del ${criterio}.`, 178);
    doc.text(lineas, 17, y + 11);
    return y + 20;
  }
}
