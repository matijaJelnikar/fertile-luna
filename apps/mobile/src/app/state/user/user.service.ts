import { Injectable, computed, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LoginFlowEndpoints } from '../../shared/constants/endpoints.constants';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  profileResource = resource({
    loader: () =>
      firstValueFrom(
        this.http.get<{ username?: string; email: string }>(LoginFlowEndpoints.USER_ME)
      ),
  });

  username = computed(() => this.profileResource.value()?.username ?? null);
}
