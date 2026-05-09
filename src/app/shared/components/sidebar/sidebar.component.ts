import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styles: ``
})
export class SidebarComponent {
  navItems = [
    { label: 'VPN', route: '/vpn', icon: 'vpn' },
    { label: 'CAE', route: '/cae', icon: 'cae' },
    { label: 'TIR', route: '/tir', icon: 'tir' },
    { label: 'Comparar', route: '/comparacion', icon: 'compare' },
  ];
}
