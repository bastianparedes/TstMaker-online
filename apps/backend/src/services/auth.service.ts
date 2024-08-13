import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  @Inject(JwtService)
  private readonly jwtService = new JwtService();

  readonly tokenName = 'token';

  generateToken(id: number) {
    return this.jwtService.signAsync({ id });
  }
  decodeToken(token: string) {
    try {
      const { id } = this.jwtService.verify(token) as { id: number };
      return {
        valid: true as const,
        id
      };
    } catch {
      return {
        valid: false as const
      };
    }
  }
}
