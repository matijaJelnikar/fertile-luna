import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FobComponent } from './fob.component';

describe('FobComponent', () => {
  let component: FobComponent;
  let fixture: ComponentFixture<FobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FobComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
