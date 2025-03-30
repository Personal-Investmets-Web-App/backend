import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/app/user.service';
import { JwtService } from '@nestjs/jwt';
import {
  comparePassword,
  hashLongString,
  verifyLongString,
} from 'src/shared/utils/cripto';
import { errAsync, okAsync, Result } from 'neverthrow';
import {
  LoginDto,
  LoginSchema,
  UserJwt,
  UserJwtSchema,
} from '../infra/auth.models';
import { envs } from 'src/config/envs';
import { ValidateFuncInput } from 'src/shared/decorators/validate-function-input';
import {
  AUTH_ERRORS,
  IssueTokenError,
  UserHasNoPasswordError,
  UserPasswordIsInvalidError,
  ValidateUserWithPasswordError,
} from '../infra/auth.errors';
import { CreateUserDto, CreateUserSchema } from 'src/user/domain/user.dtos';
import { User } from 'src/user/domain/user.entities';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  @ValidateFuncInput(LoginSchema)
  async validateUserWithPassword(
    loginDto: LoginDto,
  ): Promise<Result<User, ValidateUserWithPasswordError>> {
    const user = await this.usersService.getUserByEmail(loginDto.email);
    if (user.isErr()) {
      this.logger.error('validateUserWithPassword', user.error);
      return errAsync(user.error);
    }

    this.logger.log('validateUserWithPassword', 'User found');

    if (!user.value.password) {
      this.logger.error('validateUserWithPassword', 'User has no password');
      const userHasNoPasswordError: UserHasNoPasswordError = {
        type: AUTH_ERRORS.USER_HAS_NO_PASSWORD_ERROR,
        error: new Error('User has no password, try another login method'),
      };
      return errAsync(userHasNoPasswordError);
    }

    const isPasswordValid = await comparePassword(
      loginDto.password,
      user.value.password,
    );

    if (isPasswordValid.isErr()) {
      this.logger.error('validateUserWithPassword', 'User password is invalid');
      const userPasswordIsInvalidError: UserPasswordIsInvalidError = {
        type: AUTH_ERRORS.USER_PASSWORD_IS_INVALID_ERROR,
        error: new Error('User password is invalid'),
      };
      return errAsync(userPasswordIsInvalidError);
    }

    return okAsync(user.value);
  }

  async validateUser(email: string) {
    const user = await this.usersService.getUserByEmail(email);
    if (user.isErr()) {
      return errAsync(user.error);
    }
    return okAsync(user.value);
  }

  @ValidateFuncInput(CreateUserSchema)
  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
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
    if (hashedRefreshToken.isErr()) {
      return errAsync(hashedRefreshToken.error);
    }

    const updatedUser = await this.usersService.updateUserById(user.id, {
      hashedRefreshToken: hashedRefreshToken.value,
    });

    if (updatedUser.isErr()) {
      return errAsync(updatedUser.error);
    }

    return okAsync({
      accessToken: tokens.value.accessToken,
      refreshToken: tokens.value.refreshToken,
    });
  }

  @ValidateFuncInput(UserJwtSchema)
  async logOut(user: UserJwt) {
    const updatedUser = await this.usersService.updateUserById(user.id, {
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
          type: AUTH_ERRORS.ISSUE_TOKEN_ERROR,
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
          type: AUTH_ERRORS.ISSUE_TOKEN_ERROR,
          error: new Error('Failed to issue refresh token'),
        };
        return issueTokenError;
      },
    );
    return refreshToken(user);
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.usersService.getUserById(userId);
    if (user.isErr()) {
      return errAsync(user.error);
    }

    if (!user.value.hashedRefreshToken) {
      return errAsync({
        type: AUTH_ERRORS.EXPIRED_REFRESH_TOKEN_ERROR,
        error: new Error('User has no refresh token'),
      });
    }

    const isRefreshTokenValid = await verifyLongString(
      refreshToken,
      user.value.hashedRefreshToken,
    );

    if (isRefreshTokenValid.isErr()) {
      return errAsync(isRefreshTokenValid.error);
    }

    if (!isRefreshTokenValid.value) {
      return errAsync({
        type: AUTH_ERRORS.EXPIRED_REFRESH_TOKEN_ERROR,
        error: new Error('Refresh token is invalid'),
      });
    }

    return okAsync(user.value);
  }
}
