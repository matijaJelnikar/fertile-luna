import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'lib-fob',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fob.component.html',
  styleUrl: './fob.component.scss',
})
export class FobComponent {}
