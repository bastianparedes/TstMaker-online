import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { getPromise } from '../utils/promise';

interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);

  isStrictAuthenticated: Promise<boolean>;
  isAuthenticated: undefined | null | boolean = undefined;
  userData:
    | undefined
    | null
    | {
        firstName: string;
      } = undefined;

  constructor() {
    const { promise, resolve } = getPromise<boolean>();
    this.isStrictAuthenticated = promise;

    if (isPlatformBrowser(this.platformId)) {
      this.getUserData().subscribe({
        next: (response) => {
          this.isAuthenticated = true;
          this.userData = response.data;
          resolve(true);
        },
        error: () => {
          this.isAuthenticated = false;
          resolve(false);
          this.userData = null;
        }
      });
      return;
    }

    resolve(false);
  }

  signUp(userData: { firstName: string; lastName: string; email: string; password: string }) {
    return this.httpClient.post<{
      success: boolean;
      errors: string[];
      data: { fileName: string };
    }>('/api/auth/sign_up', userData);
  }

  logIn(email: string, password: string, keepSesion: boolean) {
    return this.httpClient.post<{
      success: boolean;
      errors: string[];
      data: { fileName: string };
    }>('/api/auth/log_in', { email, password, keepSesion });
  }

  logOut() {
    return this.httpClient.get<{
      success: boolean;
      errors: string[];
      data: { fileName: string };
    }>('/api/auth/log_out');
  }

  getUserData() {
    return this.httpClient.get<{
      success: boolean;
      errors: string[];
      data: UserData;
    }>('/api/auth/user_data', { responseType: 'json' });
  }
}
