import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  dataSource = new MatTableDataSource<MeasurementDto>();
  constructor(public historyService: HistoryService) {}

  ngOnInit(): void {
    this.historyService.initHistory();

    this.dataSource.data = [...this.historyService.measurements];
  }
}
