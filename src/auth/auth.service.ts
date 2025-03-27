import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import {
  comparePassword,
  hashLongString,
  verifyLongString,
} from 'src/shared/utils/cripto';
import { errAsync, okAsync, Result } from 'neverthrow';
import { User, UserInsertDto, UserInsertSchema } from 'src/users/users.models';
import { LoginDto, LoginSchema, UserJwt, UserJwtSchema } from './auth.models';
import { envs } from 'src/config/envs';
import { ValidateFuncInput } from 'src/shared/decorators/validate-function-input';
import {
  IssueTokenError,
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

  @ValidateFuncInput(UserInsertSchema)
  async register(createUserDto: UserInsertDto) {
    const user = await this.usersService.createUserInDb(createUserDto);
    if (user.isErr()) {
      return errAsync(user.error);
    }
    return okAsync(user.value);
  }

  @ValidateFuncInput(UserJwtSchema)
  async login(user: UserJwt) {
    const tokens = await this.createTokens(user);

    if (tokens.isErr()) {
      return errAsync(tokens.error);
    }

    const hashedRefreshToken = await hashLongString(tokens.value.refreshToken);
    const updatedUser = await this.usersService.updateUserInDbById(user.id, {
      hashedRefreshToken: hashedRefreshToken,
    });

    if (updatedUser.isErr()) {
      return errAsync(updatedUser.error);
    }

    return okAsync({
      accessToken: tokens.value.accessToken,
      refreshToken: tokens.value.refreshToken,
    });
  }

  async logOut(user: UserJwt) {
    const updatedUser = await this.usersService.updateUserInDbById(user.id, {
      hashedRefreshToken: null,
    });

    if (updatedUser.isErr()) {
      return errAsync(updatedUser.error);
    }

    return okAsync(updatedUser.value);
  }

  @ValidateFuncInput(UserJwtSchema)
  async refreshToken(user: UserJwt) {
    const tokens = await this.login(user);
    if (tokens.isErr()) {
      return errAsync(tokens.error);
    }

    return okAsync(tokens.value);
  }

  @ValidateFuncInput(UserJwtSchema)
  async createTokens(user: UserJwt) {
    const [accessToken, refreshToken] = await Promise.all([
      this.createAccessToken(user),
      this.createRefreshToken(user),
    ]);

    if (accessToken.isErr()) {
      return errAsync(accessToken.error);
    }

    if (refreshToken.isErr()) {
      return errAsync(refreshToken.error);
    }

    return okAsync({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
    });
  }

  @ValidateFuncInput(UserJwtSchema)
  createAccessToken(user: UserJwt) {
    const accessToken = Result.fromThrowable(
      (user: UserJwt) => this.jwtService.sign(user),
      () => {
        const issueTokenError: IssueTokenError = {
          type: 'ISSUE_TOKEN_ERROR',
          error: new Error('Failed to issue access token'),
        };
        return issueTokenError;
      },
    );
    return accessToken(user);
  }

  @ValidateFuncInput(UserJwtSchema)
  createRefreshToken(user: UserJwt) {
    const refreshToken = Result.fromThrowable(
      (user: UserJwt) =>
        this.jwtService.sign(user, {
          secret: envs.REFRESH_JWT_SECRET,
          expiresIn: envs.REFRESH_JWT_EXPIRE_IN,
        }),
      () => {
        const issueTokenError: IssueTokenError = {
          type: 'ISSUE_TOKEN_ERROR',
          error: new Error('Failed to issue refresh token'),
        };
        return issueTokenError;
      },
    );
    return refreshToken(user);
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.usersService.getUserFromDbById(userId);
    if (user.isErr()) {
      return errAsync(user.error);
    }

    if (!user.value.hashedRefreshToken) {
      return errAsync({
        type: 'EXPIRED_REFRESH_TOKEN_ERROR',
        error: new Error('User has no refresh token'),
      });
    }

    const isRefreshTokenValid = await verifyLongString(
      refreshToken,
      user.value.hashedRefreshToken,
    );

    if (!isRefreshTokenValid) {
      return errAsync({
        type: 'EXPIRED_REFRESH_TOKEN_ERROR',
        error: new Error('Refresh token is invalid'),
      });
    }

    return okAsync(user.value);
  }
}
