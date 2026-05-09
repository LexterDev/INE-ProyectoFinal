import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-list.component.html',
  styles: ``
})
export class ErrorListComponent {
  @Input() errores: string[] = [];
}
