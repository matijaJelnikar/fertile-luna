/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CycleService } from './cycle.service';

describe('Service: Cycle', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CycleService]
    });
  });

  it('should ...', inject([CycleService], (service: CycleService) => {
    expect(service).toBeTruthy();
  }));
});
