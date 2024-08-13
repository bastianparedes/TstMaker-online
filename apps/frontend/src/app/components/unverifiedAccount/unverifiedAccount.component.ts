import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-unverified-account',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './unverifiedAccount.component.html',
  styleUrl: './unverifiedAccount.component.scss'
})
export class UnverifiedAccountComponent {}
