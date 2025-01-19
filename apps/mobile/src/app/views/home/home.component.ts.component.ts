import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.ts.component.html',
  styleUrl: './home.component.ts.component.scss',
})
export class HomeComponent {}
