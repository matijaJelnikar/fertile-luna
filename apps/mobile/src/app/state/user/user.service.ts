import { Injectable, computed, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';
import { API } from '../../shared/constants/endpoints.constants';
import { toCalendarDay } from '../measurements/cycle-day';

interface Profile {
  username?: string;
  email: string;
  /** `YYYY-MM-DD`, the calendar day the column holds. */
  contraceptionStoppedOn?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  profileResource = resource({
    loader: () => firstValueFrom(this.http.get<Profile>(API.auth.me)),
  });

  username = computed(() => this.profileResource.value()?.username ?? null);

  /** When hormonal contraception was stopped, if recorded (`#R-LIFE-02`). */
  contraceptionStoppedOn = computed(
    () => this.profileResource.value()?.contraceptionStoppedOn ?? null
  );

  /** `null` clears the date. */
  setContraceptionStoppedOn(date: Date | null) {
    return this.http
      .post<unknown>(API.auth.updateUser, {
        contraceptionStoppedOn: date ? toCalendarDay(date) : null,
      })
      .pipe(tap(() => this.profileResource.reload()));
  }
}
