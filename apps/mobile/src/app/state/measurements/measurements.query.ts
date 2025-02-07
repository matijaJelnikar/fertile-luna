import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Query } from '@datorama/akita';
import { MeasurementsState, MeasurementsStore } from './measurements.store';

@Injectable({ providedIn: 'root' })
export class MeasurementsQuery extends Query<MeasurementsState> {
  measurements = toSignal(this.select((state) => state.measurements));

  constructor(store: MeasurementsStore) {
    super(store);
  }
}
