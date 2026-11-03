import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'lib-fab',
  templateUrl: './fab.component.html',
  styleUrls: ['./fab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, MatFabButton],
})
export class FabComponent {
  icon = input('add');
  color = input('accent');
  position = input<'bottom-right' | 'bottom-left'>('bottom-right');
  label = input.required<string>();
  fabClick = output<void>();
}
