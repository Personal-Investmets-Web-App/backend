import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super();
  }

  async validate(email: string, password: string) {
    this.logger.log('Validating user');
    const user = await this.authService.validateUserWithPassword(
      email,
      password,
    );
    if (user.isErr()) {
      throw new UnauthorizedException();
    }
    return user.value;
  }
}

export type LocalStrategyRequest = Request & {
  user: { email: string; id: number };
};
