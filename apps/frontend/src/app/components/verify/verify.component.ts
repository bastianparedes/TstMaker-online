/* eslint-disable @typescript-eslint/no-empty-function */
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../../environments/environment';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss'
})
export class VerifyComponent {
  route = inject(ActivatedRoute);
  httpClient = inject(HttpClient);
  platformId = inject(PLATFORM_ID);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const token = params.get('token');
      if (typeof token !== 'string') return;

      const queryParams = new URLSearchParams();
      queryParams.append('token', token);
      const completeUrl = environment.BASE_URL + '/api/auth/verify?' + queryParams.toString();

      this.httpClient.get(completeUrl).subscribe({
        next: () => {},
        error: () => {},
        complete: () => {}
      });
    });
  }
}
