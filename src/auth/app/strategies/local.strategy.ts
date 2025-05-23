import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AUTH_ERRORS } from '../../infra/auth.errors';
import { CRUD_ERRORS } from 'src/shared/infra/errors/crud-erros';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    this.logger.log('Validating user');
    const user = await this.authService.validateUserWithPassword({
      email,
      password,
    });

    if (user.isErr()) {
      this.logger.error(user.error);
      if (
        user.error.type === AUTH_ERRORS.USER_PASSWORD_IS_INVALID_ERROR ||
        user.error.type === AUTH_ERRORS.USER_HAS_NO_PASSWORD_ERROR ||
        user.error.type === CRUD_ERRORS.NOT_FOUND
      ) {
        this.logger.log(
          'User not found, password invalid or has no password, maybe provider login',
          user.error,
        );
        throw new BadRequestException();
      }

      throw new InternalServerErrorException();
    }

    return user.value;
  }
}
