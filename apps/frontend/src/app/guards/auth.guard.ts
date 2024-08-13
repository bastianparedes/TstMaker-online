import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  async canActivate() {
    if (isPlatformBrowser(this.platformId)) {
      if (await this.authService.isStrictAuthenticated) {
        return true;
      } else {
        window.location.href = '/log_in';
        return false;
      }
    }
    return false;
  }
}
