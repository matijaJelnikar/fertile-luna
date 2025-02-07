import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MeasurementDto } from '@basal-temp-log-workspace/model';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';
import { HistoryService } from './history.service';

@Component({
  standalone: true,
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  providers: [HistoryService],
  imports: [MaterialModule, FormsModule, CommonModule, TranslateModule],
})
export class HistoryComponent implements OnInit {
  displayedColumns: string[] = ['temperature', 'timestamp'];
  historyService = inject(HistoryService);
  dataSource = new MatTableDataSource<MeasurementDto>(
    this.historyService.measurements()
  );
  source = computed(() => {
    return new MatTableDataSource<MeasurementDto>(
      this.historyService.measurements()
    );
  });

  ngOnInit(): void {}
}
