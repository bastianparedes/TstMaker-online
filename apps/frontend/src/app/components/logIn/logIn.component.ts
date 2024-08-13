import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';

import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  providers: [MessageService],
  imports: [TranslateModule, FormsModule, ReactiveFormsModule, InputTextModule, FloatLabelModule, PasswordModule, ButtonModule, CheckboxModule, ToastModule, RippleModule],
  templateUrl: './logIn.component.html'
})
export class LogInComponent {
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly translateService = inject(TranslateService);

  isLogingIn = false;

  userData = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true
    }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true
    }),
    keepSesion: new FormControl(false, {
      validators: [Validators.required],
      nonNullable: true
    })
  });

  hidePassword = true;
  toggleHidePassword() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(event: Event) {
    event.preventDefault();

    this.isLogingIn = true;
    const { email, password, keepSesion } = this.userData.getRawValue();
    this.authService
      .logIn(email, password, keepSesion)
      .pipe(
        finalize(() => {
          this.isLogingIn = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.errors.includes('unverified')) window.location.href = '/unverified_account';
          else window.location.href = '/create_exam';
        },
        error: () => {
          this.messageService.clear();
          this.messageService.add({
            severity: 'error',
            summary: this.translateService.instant('logIn.userOrPasswordWrong')
          });
        }
      });
  }
}
