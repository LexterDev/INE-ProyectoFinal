import { Injectable } from '@angular/core';

export interface ResultadoTIR {
  tir: number;
  tmar: number;
  veredicto: 'ACEPTADO' | 'RECHAZADO';
}

@Injectable({ providedIn: 'root' })
export class TirService {

  calcular(inversion: number, flujos: number[], salvamento: number, tmar: number): ResultadoTIR {
    const npv = (rate: number): number => {
      const n = flujos.length;
      return -inversion
        + flujos.reduce((acc, f, t) => acc + f / Math.pow(1 + rate, t + 1), 0)
        + salvamento / Math.pow(1 + rate, n);
    };

    // Bisección entre 0% y 1000%
    let low = 0;
    let high = 10;
    let mid = 0;

    // Verificar que existe solución en el rango
    if (npv(low) < 0) {
      return { tir: 0, tmar, veredicto: 'RECHAZADO' };
    }

    for (let iter = 0; iter < 2000; iter++) {
      mid = (low + high) / 2;
      const npvMid = npv(mid);
      if (npvMid > 0) low = mid;
      else high = mid;
      if (Math.abs(high - low) < 1e-10) break;
    }

    const tir = mid * 100;
    return { tir, tmar, veredicto: tir > tmar ? 'ACEPTADO' : 'RECHAZADO' };
  }
}
