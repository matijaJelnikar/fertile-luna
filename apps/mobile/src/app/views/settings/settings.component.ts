import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';
import { LocalStorageService } from '../../services/local-storage.service';
import { StorageKeys } from '../../shared/constants/common.constants';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [MaterialModule, FormsModule, TranslateModule],
})
export class SettingsComponent {
  isDarkMode: boolean;
  document = inject(DOCUMENT);
  constructor(private localStorageService: LocalStorageService) {
    // Get the current theme preference from localStorage or the system
    this.isDarkMode = this.localStorageService.getItem(StorageKeys.DARK_MODE);
  }

  // Method called when the dark mode toggle is changed
  onDarkModeChange() {
    this.isDarkMode = this.document.body.classList.toggle('dark');
    this.localStorageService.setItem(StorageKeys.DARK_MODE, this.isDarkMode);
  }
}
