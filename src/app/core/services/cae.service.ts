import { Injectable } from '@angular/core';

export interface ResultadoCAE {
  cae: number;
  costoInicial: number;
  vpSalvamento: number;
}

@Injectable({ providedIn: 'root' })
export class CaeService {

  calcular(costoInicial: number, tasa: number, años: number, costosOperacion: number, salvamento: number): ResultadoCAE {
    const i = tasa / 100;
    const factorRecuperacion = (i * Math.pow(1 + i, años)) / (Math.pow(1 + i, años) - 1);
    const vpSalvamento = salvamento / Math.pow(1 + i, años);
    const cae = (costoInicial - vpSalvamento) * factorRecuperacion + costosOperacion;

    return { cae, costoInicial, vpSalvamento };
  }
}
