import type { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CreateExamComponent } from './components/createExam/createExam.component';
import { SignUpComponent } from './components/signUp/signUp.component';
import { LogInComponent } from './components/logIn/logIn.component';
import { VerifyComponent } from './components/verify/verify.component';
import { UnverifiedAccountComponent } from './components/unverifiedAccount/unverifiedAccount.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'sign_up', component: SignUpComponent },
  { path: 'unverified_account', component: UnverifiedAccountComponent },
  { path: 'verify/:token', component: VerifyComponent },
  { path: 'log_in', component: LogInComponent },
  { path: 'create_exam', component: CreateExamComponent, canActivate: [AuthGuard] },
  { path: '', component: HomeComponent }
];
