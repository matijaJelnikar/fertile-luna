/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { CycleService } from './cycle.service';

describe('Service: CycleService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CycleService],
    });
  });

  it('should ...', inject([CycleService], (service: CycleService) => {
    expect(service).toBeTruthy();
  }));
});
