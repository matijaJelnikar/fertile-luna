import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FobComponent } from '@basal-temp-log-workspace/components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FobComponent],
  templateUrl: './home.component.ts.component.html',
  styleUrl: './home.component.ts.component.scss',
})
export class HomeComponent {}
