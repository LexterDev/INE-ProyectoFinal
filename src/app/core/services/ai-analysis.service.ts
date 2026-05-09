import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

const PROXY_URL = 'http://localhost:8080/INE135/INE-ProyectoFinal/api/analizar.php';

const USD = (n: number) =>
  new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(n);
const PCT = (n: number) => `${n.toFixed(2)}%`;

// ── Fallbacks locales ────────────────────────────────────────────────────────

function fallbackVPN(d: any, r: any): string {
  const ratio = ((r.vpn / d.inversion) * 100).toFixed(1);
  const flujoPromedio = (d.flujos.reduce((a: number, b: number) => a + b, 0) / d.flujos.length);

  if (r.veredicto === 'ACEPTADO') {
    return `El proyecto presenta un Valor Presente Neto de ${USD(r.vpn)}, lo que representa un retorno adicional equivalente al ${ratio}% de la inversión inicial una vez descontado el costo de oportunidad del ${d.tasa}% anual. ` +
      `Con un flujo de caja promedio de ${USD(flujoPromedio)} por año durante ${d.flujos.length} años, el proyecto genera valor sostenido por encima de la tasa de descuento exigida. ` +
      `El valor de salvamento de ${USD(d.salvamento)} contribuye positivamente al VP total de ingresos de ${USD(r.vpIngresos)}. ` +
      `Dado que VPN > 0, se recomienda ejecutar la inversión, ya que supera el costo de oportunidad del capital y agrega valor neto al inversionista.`;
  }

  if (r.veredicto === 'RECHAZADO') {
    const faltante = Math.abs(r.vpn);
    return `El proyecto arroja un Valor Presente Neto negativo de ${USD(r.vpn)}, indicando que los flujos de caja descontados al ${d.tasa}% anual no logran recuperar la inversión inicial de ${USD(d.inversion)}. ` +
      `El déficit de ${USD(faltante)} refleja que el proyecto destruye valor respecto al costo de oportunidad del capital. ` +
      `El flujo promedio de ${USD(flujoPromedio)} por año resulta insuficiente para cubrir la tasa de descuento exigida durante los ${d.flujos.length} años de vida útil. ` +
      `Se recomienda no ejecutar el proyecto bajo estas condiciones. Para hacerlo viable sería necesario incrementar los flujos proyectados, reducir la inversión inicial o aceptar una tasa de descuento menor.`;
  }

  return `El proyecto presenta un VPN de $0.00, lo que indica que los flujos de caja descontados al ${d.tasa}% recuperan exactamente la inversión inicial de ${USD(d.inversion)}. ` +
    `El proyecto es indiferente desde el punto de vista financiero: ni agrega ni destruye valor respecto al costo de oportunidad. ` +
    `La decisión de ejecutarlo dependerá de factores estratégicos o cualitativos adicionales no capturados en el análisis cuantitativo.`;
}

function fallbackCAE(d: any, r: any): string {
  const i = d.tasa / 100;
  const factor = (i * Math.pow(1 + i, d.anios)) / (Math.pow(1 + i, d.anios) - 1);
  const capitalPct = ((r.cae - d.costosOperacion) / r.cae * 100).toFixed(1);
  const opPct = ((d.costosOperacion / r.cae) * 100).toFixed(1);

  return `El Costo Anual Equivalente calculado de ${USD(r.cae)} representa el desembolso uniforme anual que equivale económicamente a todos los costos asociados al activo durante su vida útil de ${d.anios} años. ` +
    `Del total del CAE, aproximadamente el ${capitalPct}% corresponde a la recuperación del capital invertido (${USD(d.costoInicial - r.vpSalvamento)} neto de salvamento) y el ${opPct}% a los costos de operación anuales de ${USD(d.costosOperacion)}. ` +
    `El factor de recuperación de capital aplicado a la tasa del ${d.tasa}% es ${factor.toFixed(4)}, mientras que el valor presente del salvamento de ${USD(r.vpSalvamento)} reduce efectivamente la base sobre la que se aplica dicho factor. ` +
    `Este valor de ${USD(r.cae)}/año debe compararse con alternativas equivalentes: se seleccionará la opción que presente el menor CAE, independientemente de las diferencias en costo inicial o vida útil.`;
}

function fallbackTIR(d: any, r: any): string {
  const margen = (r.tir - r.tmar).toFixed(2);
  const flujoPromedio = (d.flujos.reduce((a: number, b: number) => a + b, 0) / d.flujos.length);

  if (r.veredicto === 'ACEPTADO') {
    return `La Tasa Interna de Retorno calculada es ${PCT(r.tir)}, superando la TMAR del ${PCT(r.tmar)} por un margen de ${margen} puntos porcentuales. ` +
      `Esto indica que el proyecto genera un rendimiento intrínseco superior al costo de oportunidad del capital, haciendo la inversión de ${USD(d.inversion)} atractiva financieramente. ` +
      `Con un flujo promedio de ${USD(flujoPromedio)} durante ${d.flujos.length} años más un valor de salvamento de ${USD(d.salvamento)}, el proyecto ofrece un margen de seguridad razonable frente a variaciones en los flujos proyectados. ` +
      `Se recomienda aceptar la inversión. A mayor distancia entre TIR y TMAR, menor es el riesgo de que variaciones adversas en los flujos conviertan el proyecto en no rentable.`;
  }

  return `La Tasa Interna de Retorno calculada es ${PCT(r.tir)}, valor que no alcanza la TMAR exigida del ${PCT(r.tmar)}, quedando por debajo en ${Math.abs(parseFloat(margen)).toFixed(2)} puntos porcentuales. ` +
    `Esto significa que el rendimiento intrínseco del proyecto es insuficiente para compensar el costo de oportunidad del capital. ` +
    `Con una inversión de ${USD(d.inversion)} y un flujo promedio de ${USD(flujoPromedio)} durante ${d.flujos.length} años, el proyecto no supera el umbral mínimo de rentabilidad establecido. ` +
    `Se recomienda rechazar la inversión. Para mejorar la TIR sería necesario incrementar los flujos de caja, reducir la inversión inicial o extender la vida útil del proyecto.`;
}

const COMP_LABELS = ['A', 'B', 'C', 'D'];

function fallbackComparacionVPN(alts: any[], resultados: any[], ganadorIdx: number): string {
  const vals = resultados.map((r, i) => `Alt. ${COMP_LABELS[i]}: ${USD(r.vpn)}`).join(', ');
  if (ganadorIdx === -1) {
    return `Las ${alts.length} alternativas presentan un Valor Presente Neto equivalente (${vals}), lo que indica equivalencia económica perfecta bajo las tasas de descuento aplicadas. ` +
      `La decisión deberá basarse en criterios cualitativos como riesgo operativo, flexibilidad estratégica o facilidad de implementación.`;
  }
  const ganLabel = `Alternativa ${COMP_LABELS[ganadorIdx]}`;
  const rGan = resultados[ganadorIdx];
  const dGan = alts[ganadorIdx];
  const allAccepted = resultados.every((r: any) => r.veredicto === 'ACEPTADO');
  return `La ${ganLabel} es la opción recomendada con el mayor VPN de ${USD(rGan.vpn)} entre las ${alts.length} alternativas evaluadas (${vals}). ` +
    (allAccepted ? `Todas las alternativas son individualmente aceptables (VPN > 0); sin embargo, el criterio VPN establece seleccionar la de mayor valor presente neto positivo. ` : ``) +
    `Con una inversión de ${USD(dGan.inversion)} y una tasa de descuento del ${dGan.tasa}%, la ${ganLabel} maximiza el valor generado para el inversionista. ` +
    `Se recomienda ejecutar la ${ganLabel}.`;
}

function fallbackComparacionCAE(alts: any[], resultados: any[], ganadorIdx: number): string {
  const vals = resultados.map((r, i) => `Alt. ${COMP_LABELS[i]}: ${USD(r.cae)}/año`).join(', ');
  if (ganadorIdx === -1) {
    return `Las ${alts.length} alternativas presentan un Costo Anual Equivalente idéntico (${vals}), indicando equivalencia económica total. ` +
      `La elección dependerá de factores no económicos como disponibilidad, soporte técnico o preferencia operativa.`;
  }
  const ganLabel = `Alternativa ${COMP_LABELS[ganadorIdx]}`;
  const rGan = resultados[ganadorIdx];
  const dGan = alts[ganadorIdx];
  const secondIdx = resultados
    .map((r: any, i: number) => ({ cae: r.cae, i }))
    .filter((x: any) => x.i !== ganadorIdx)
    .sort((a: any, b: any) => a.cae - b.cae)[0]?.i ?? (ganadorIdx === 0 ? 1 : 0);
  const ahorro = resultados[secondIdx].cae - rGan.cae;
  return `La ${ganLabel} presenta el menor Costo Anual Equivalente con ${USD(rGan.cae)}/año. Comparación: ${vals}. ` +
    `El método CAE permite esta comparación directa aunque las alternativas tengan vidas útiles distintas, al reducir todos los costos a una anualidad uniforme equivalente. ` +
    `El ahorro anual respecto a la siguiente mejor opción es de ${USD(ahorro)}, lo que justifica seleccionar la ${ganLabel}. ` +
    `La combinación de costo inicial ${USD(dGan.costoInicial)}, tasa del ${dGan.tasa}% y costos de operación de ${USD(dGan.costosOperacion ?? 0)}/año resulta en la estructura de costos más eficiente.`;
}

function fallbackComparacionTIR(alts: any[], resultados: any[], ganadorIdx: number): string {
  const vals = resultados.map((r, i) => `Alt. ${COMP_LABELS[i]}: ${PCT(r.tir)}`).join(', ');
  if (ganadorIdx === -1) {
    return `Las ${alts.length} alternativas presentan TIRs idénticas (${vals}). ` +
      `La decisión debe apoyarse en criterios complementarios como el monto de inversión requerido, el perfil de riesgo de los flujos o la estrategia corporativa.`;
  }
  const ganLabel = `Alternativa ${COMP_LABELS[ganadorIdx]}`;
  const rGan = resultados[ganadorIdx];
  const dGan = alts[ganadorIdx];
  const tmar = dGan.tmar;
  const margen = (rGan.tir - tmar).toFixed(2);
  const altsAboveTmar = resultados.filter((r: any) => r.tir > tmar).length;
  return `La ${ganLabel} obtiene la mayor Tasa Interna de Retorno con ${PCT(rGan.tir)}, superando la TMAR del ${PCT(tmar)} por ${margen} puntos porcentuales. ` +
    `TIRs calculadas: ${vals}. ` +
    (altsAboveTmar === alts.length
      ? `Las ${alts.length} alternativas superan la TMAR; sin embargo, la ${ganLabel} maximiza el rendimiento intrínseco. `
      : `Solo ${altsAboveTmar} de las ${alts.length} alternativas supera la TMAR, siendo la ${ganLabel} la de mejor rendimiento. `) +
    `Con una inversión de ${USD(dGan.inversion)}, se recomienda ejecutar la ${ganLabel}.`;
}

// ── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {

  constructor(private http: HttpClient) {}

  analizarVPN(datos: any, resultado: any): Observable<string> {
    return this.http.post<{ analisis: string }>(PROXY_URL, { metodo: 'vpn', datos, resultado }).pipe(
      map(r => r.analisis || fallbackVPN(datos, resultado)),
      catchError(() => of(fallbackVPN(datos, resultado)))
    );
  }

  analizarCAE(datos: any, resultado: any): Observable<string> {
    return this.http.post<{ analisis: string }>(PROXY_URL, { metodo: 'cae', datos, resultado }).pipe(
      map(r => r.analisis || fallbackCAE(datos, resultado)),
      catchError(() => of(fallbackCAE(datos, resultado)))
    );
  }

  analizarTIR(datos: any, resultado: any): Observable<string> {
    return this.http.post<{ analisis: string }>(PROXY_URL, { metodo: 'tir', datos, resultado }).pipe(
      map(r => r.analisis || fallbackTIR(datos, resultado)),
      catchError(() => of(fallbackTIR(datos, resultado)))
    );
  }

  analizarComparacionVPN(alts: any[], resultados: any[], ganadorIdx: number): Observable<string> {
    const ganadorLabel = ganadorIdx >= 0 ? COMP_LABELS[ganadorIdx] : 'empate';
    return this.http.post<{ analisis: string }>(PROXY_URL, { metodo: 'comparacion_vpn', datos: { alts }, resultado: { resultados, ganadorLabel } }).pipe(
      map(r => r.analisis || fallbackComparacionVPN(alts, resultados, ganadorIdx)),
      catchError(() => of(fallbackComparacionVPN(alts, resultados, ganadorIdx)))
    );
  }

  analizarComparacionCAE(alts: any[], resultados: any[], ganadorIdx: number): Observable<string> {
    const ganadorLabel = ganadorIdx >= 0 ? COMP_LABELS[ganadorIdx] : 'empate';
    return this.http.post<{ analisis: string }>(PROXY_URL, { metodo: 'comparacion_cae', datos: { alts }, resultado: { resultados, ganadorLabel } }).pipe(
      map(r => r.analisis || fallbackComparacionCAE(alts, resultados, ganadorIdx)),
      catchError(() => of(fallbackComparacionCAE(alts, resultados, ganadorIdx)))
    );
  }

  analizarComparacionTIR(alts: any[], resultados: any[], ganadorIdx: number): Observable<string> {
    const ganadorLabel = ganadorIdx >= 0 ? COMP_LABELS[ganadorIdx] : 'empate';
    return this.http.post<{ analisis: string }>(PROXY_URL, { metodo: 'comparacion_tir', datos: { alts }, resultado: { resultados, ganadorLabel } }).pipe(
      map(r => r.analisis || fallbackComparacionTIR(alts, resultados, ganadorIdx)),
      catchError(() => of(fallbackComparacionTIR(alts, resultados, ganadorIdx)))
    );
  }
}
