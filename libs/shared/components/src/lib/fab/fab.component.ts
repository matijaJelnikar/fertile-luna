import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'lib-fab',
  templateUrl: './fab.component.html',
  styleUrls: ['./fab.component.scss'],
  imports: [MatIcon, NgClass, MatFabButton],
})
export class FabComponent {
  @Input() icon = 'add';
  @Input() color = 'accent';
  @Input() position: 'bottom-right' | 'bottom-left' = 'bottom-right';
  @Output() fabClick = new EventEmitter<void>();

  onClick() {
    this.fabClick.emit();
  }
}
