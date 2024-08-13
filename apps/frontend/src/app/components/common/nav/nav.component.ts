import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [TranslateModule, ButtonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  readonly authService = inject(AuthService);

  isOpen = false;

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  logOut() {
    this.authService.logOut().subscribe({
      next: () => {
        window.location.href = '/';
      }
    });
  }
}
