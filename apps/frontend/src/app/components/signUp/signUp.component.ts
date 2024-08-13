import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';

import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  providers: [MessageService],
  imports: [TranslateModule, FormsModule, ReactiveFormsModule, InputTextModule, FloatLabelModule, PasswordModule, ButtonModule, DividerModule, ToastModule, RippleModule],
  templateUrl: './signUp.component.html'
})
export class SignUpComponent {
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly translateService = inject(TranslateService);

  constructor() {
    this.userData.addValidators(() => {
      if (this?.passwordsAreEqual()) return null;
      return { passwordsNotEqual: true };
    });
  }

  isSigningUp = false;

  userData = new FormGroup({
    firstName: new FormControl('', {
      validators: [Validators.required, Validators.minLength(1), Validators.maxLength(255)],
      nonNullable: true
    }),
    lastName: new FormControl('', {
      validators: [Validators.required, Validators.minLength(1), Validators.maxLength(255)],
      nonNullable: true
    }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(255)],
      nonNullable: true
    }),
    confirmPassword: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true
    })
  });

  passwordsAreEqual() {
    const values = this.userData.getRawValue();
    return values.password === values.confirmPassword;
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (this.userData.invalid) return;

    this.isSigningUp = true;
    this.authService
      .signUp(this.userData.getRawValue())
      .pipe(
        finalize(() => {
          this.isSigningUp = false;
        })
      )
      .subscribe({
        next: () => {
          window.location.href = '/unverified_account';
        },
        error: () => {
          this.messageService.clear();
          this.messageService.add({
            severity: 'error',
            summary: this.translateService.instant('signUp.emailUsed')
          });
        }
      });
  }
}
