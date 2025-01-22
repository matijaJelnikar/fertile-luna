import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FabComponent } from '@basal-temp-log-workspace/components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FabComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  addRecord(): void {}
}
