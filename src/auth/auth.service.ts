import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from 'src/shared/utils/cripto';
import { errAsync, okAsync, Result } from 'neverthrow';
import { User, UserInsertDto, UserInsertSchema } from 'src/users/users.models';
import { LoginDto, LoginSchema, UserJwt, UserJwtSchema } from './auth.models';
import { envs } from 'src/config/envs';
import { ValidateFuncInput } from 'src/shared/decorators/validate-function-input';
import {
  UserHasNoPasswordError,
  UserPasswordIsInvalidError,
  ValidateUserWithPasswordError,
} from './auth.errors';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  @ValidateFuncInput(LoginSchema)
  async validateUserWithPassword(
    loginDto: LoginDto,
  ): Promise<Result<User, ValidateUserWithPasswordError>> {
    const user = await this.usersService.getUserFromDbByEmail(loginDto.email);
    if (user.isErr()) {
      this.logger.error('validateUserWithPassword', user.error);
      return errAsync(user.error);
    }

    this.logger.log('validateUserWithPassword', 'User found');

    if (!user.value.password) {
      this.logger.error('validateUserWithPassword', 'User has no password');
      const userHasNoPasswordError: UserHasNoPasswordError = {
        type: 'USER_HAS_NO_PASSWORD_ERROR',
        error: new Error('User has no password, try another login method'),
      };
      return errAsync(userHasNoPasswordError);
    }

    const isPasswordValid = await comparePassword(
      loginDto.password,
      user.value.password,
    );
    if (!isPasswordValid) {
      this.logger.error('validateUserWithPassword', 'User password is invalid');
      const userPasswordIsInvalidError: UserPasswordIsInvalidError = {
        type: 'USER_PASSWORD_IS_INVALID_ERROR',
        error: new Error('User password is invalid'),
      };
      return errAsync(userPasswordIsInvalidError);
    }

    return okAsync(user.value);
  }

  async validateUser(email: string) {
    const user = await this.usersService.getUserFromDbByEmail(email);
    if (user.isErr()) {
      return errAsync(user.error);
    }
    return okAsync(user.value);
  }

  @ValidateFuncInput(UserJwtSchema)
  login(user: UserJwt) {
    return {
      access_token: this.jwtService.sign(user),
      refresh_token: this.jwtService.sign(user, {
        secret: envs.REFRESH_JWT_SECRET,
        expiresIn: envs.REFRESH_JWT_EXPIRE_IN,
      }),
    };
  }

  @ValidateFuncInput(UserInsertSchema)
  async register(createUserDto: UserInsertDto) {
    const user = await this.usersService.createUserInDb(createUserDto);
    if (user.isErr()) {
      return errAsync(user.error);
    }
    return okAsync(user.value);
  }

  @ValidateFuncInput(UserJwtSchema)
  refreshToken(user: UserJwt) {
    return {
      access_token: this.jwtService.sign(user),
      refresh_token: this.jwtService.sign(user, {
        secret: envs.REFRESH_JWT_SECRET,
        expiresIn: envs.REFRESH_JWT_EXPIRE_IN,
      }),
    };
  }
}
