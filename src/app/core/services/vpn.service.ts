import { Injectable } from '@angular/core';

export interface ResultadoVPN {
  vpn: number;
  vpIngresos: number;
  inversion: number;
  veredicto: 'ACEPTADO' | 'RECHAZADO' | 'INDIFERENTE';
}

@Injectable({ providedIn: 'root' })
export class VpnService {

  calcular(inversion: number, tasa: number, flujos: number[], salvamento: number): ResultadoVPN {
    const i = tasa / 100;
    const n = flujos.length;
    const vpFlujos = flujos.reduce((acc, f, t) => acc + f / Math.pow(1 + i, t + 1), 0);
    const vpSalvamento = salvamento / Math.pow(1 + i, n);
    const vpIngresos = vpFlujos + vpSalvamento;
    const vpn = vpIngresos - inversion;

    let veredicto: ResultadoVPN['veredicto'];
    if (vpn > 0.001) veredicto = 'ACEPTADO';
    else if (vpn < -0.001) veredicto = 'RECHAZADO';
    else veredicto = 'INDIFERENTE';

    return { vpn, vpIngresos, inversion, veredicto };
  }
}
