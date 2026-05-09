import { Routes } from '@angular/router';
import { VpnComponent } from './pages/vpn/vpn.component';
import { CaeComponent } from './pages/cae/cae.component';
import { TirComponent } from './pages/tir/tir.component';
import { ComparacionComponent } from './pages/comparacion/comparacion.component';

export const routes: Routes = [
  { path: '', redirectTo: 'vpn', pathMatch: 'full' },
  { path: 'vpn', component: VpnComponent },
  { path: 'cae', component: CaeComponent },
  { path: 'tir', component: TirComponent },
  { path: 'comparacion', component: ComparacionComponent },
];
