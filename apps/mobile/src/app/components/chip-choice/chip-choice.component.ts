import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import {
  MatChipListbox,
  MatChipListboxChange,
  MatChipOption,
} from '@angular/material/chips';

let nextId = 0;

/**
 * A single choice from a row of chips, bound with `[formField]`. Deselecting a chip yields `null`:
 * the bare listbox yields `undefined`, which removes the field from a signal form.
 */
@Component({
  selector: 'app-chip-choice',
  imports: [MatChipListbox, MatChipOption],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'chip-choice' },
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chip-choice-label {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
    }
  `,
  template: `
    <span class="chip-choice-label" [id]="labelId">{{ label() }}</span>
    <mat-chip-listbox
      [value]="value()"
      [disabled]="disabled()"
      [attr.aria-labelledby]="labelId"
      (change)="select($event)"
    >
      @for (option of options(); track option) {
        <mat-chip-option [value]="option">{{ option }}</mat-chip-option>
      }
    </mat-chip-listbox>
  `,
})
export class ChipChoiceComponent<T extends string>
  implements FormValueControl<T | null>
{
  readonly value = model<T | null>(null);
  readonly disabled = input(false);
  readonly touch = output<void>();

  readonly label = input.required<string>();
  readonly options = input.required<readonly T[]>();

  protected readonly labelId = `chip-choice-${nextId++}`;

  protected select(change: MatChipListboxChange): void {
    this.value.set((change.value as T | undefined) ?? null);
    this.touch.emit();
  }
}
