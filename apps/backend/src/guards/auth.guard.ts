import { CanActivate, ExecutionContext, Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  @Inject(AuthService)
  authService = new AuthService();

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.cookies.token;
    const tokenData = this.authService.decodeToken(token);

    if (tokenData.valid) return true;
    throw new UnauthorizedException({
      success: false,
      errors: ['invalidToken'],
      data: {}
    });
  }
}
