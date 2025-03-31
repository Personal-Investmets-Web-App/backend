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
  Jwt,
  LoginDto,
  LoginSchema,
  UserJwt,
  UserJwtSchema,
} from '../infra/auth.models';
import { envs } from 'src/config/envs';
import { ValidateFuncInput } from 'src/shared/app/decorators/validate-function-input';
import {
  AUTH_ERRORS,
  IssueTokenError,
  UserHasNoPasswordError,
  UserPasswordIsInvalidError,
  ValidateUserWithPasswordError,
} from '../infra/auth.errors';
import { CreateUserDto, CreateUserSchema } from 'src/user/domain/user.dtos';
import { RefreshToken, User } from 'src/user/domain/user.entities';
import { isDateAfter } from 'src/shared/utils/dates';

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

    return okAsync({
      accessToken: tokens.value.accessToken,
      refreshToken: tokens.value.refreshToken,
    });
  }

  @ValidateFuncInput(UserJwtSchema)
  async logOutAllDevices(user: UserJwt) {
    const deletedRefreshToken =
      await this.usersService.deleteAllRefreshTokenByUser(user.id);

    if (deletedRefreshToken.isErr()) {
      return errAsync(deletedRefreshToken.error);
    }

    return okAsync(undefined);
  }

  @ValidateFuncInput(UserJwtSchema)
  async refreshToken(user: UserJwt) {
    const accessToken = this.createAccessToken(user);
    if (accessToken.isErr()) {
      return errAsync(accessToken.error);
    }

    return okAsync({
      accessToken: accessToken.value,
    });
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
  async createRefreshToken(user: UserJwt) {
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

    const issuedRefreshToken = refreshToken(user);
    if (issuedRefreshToken.isErr()) {
      return errAsync(issuedRefreshToken.error);
    }

    const hashedRefreshToken = await hashLongString(issuedRefreshToken.value);
    if (hashedRefreshToken.isErr()) {
      return errAsync(hashedRefreshToken.error);
    }

    const decodedRefreshToken: Jwt = this.jwtService.decode<Jwt>(
      issuedRefreshToken.value,
    );

    const expirationDate = new Date(decodedRefreshToken.exp * 1000);

    const createdRefreshToken = await this.usersService.createRefreshToken(
      user.id,
      hashedRefreshToken.value,
      expirationDate,
    );

    if (createdRefreshToken.isErr()) {
      return errAsync(createdRefreshToken.error);
    }
    return okAsync(issuedRefreshToken.value);
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const refreshTokens =
      await this.usersService.findRefreshTokensByUserId(userId);
    if (refreshTokens.isErr()) {
      return errAsync(refreshTokens.error);
    }

    if (refreshTokens.value.length === 0) {
      return errAsync({
        type: AUTH_ERRORS.EXPIRED_REFRESH_TOKEN_ERROR,
        error: new Error('User has no refresh tokens'),
      });
    }

    let foundRefreshToken: RefreshToken | undefined;
    for (const token of refreshTokens.value) {
      const isRefreshTokenValid = await verifyLongString(
        refreshToken,
        token.hashedToken,
      );
      if (isRefreshTokenValid.isOk()) {
        foundRefreshToken = token;
        break;
      }
    }

    if (!foundRefreshToken) {
      return errAsync({
        type: AUTH_ERRORS.EXPIRED_REFRESH_TOKEN_ERROR,
        error: new Error('Refresh token is invalid'),
      });
    }

    const isRefreshTokenExpired = isDateAfter(
      new Date(),
      foundRefreshToken.expiresAt,
    );

    if (isRefreshTokenExpired) {
      return errAsync({
        type: AUTH_ERRORS.EXPIRED_REFRESH_TOKEN_ERROR,
        error: new Error('Refresh token is expired'),
      });
    }

    return okAsync(foundRefreshToken);
  }

  async deleteExpiredRefreshTokens() {
    const expiredRefreshTokens =
      await this.usersService.deleteExpiredRefreshTokens();
    if (expiredRefreshTokens.isErr()) {
      return errAsync(expiredRefreshTokens.error);
    }

    return okAsync(undefined);
  }

  async deleteAllRefreshTokens() {
    const deletedRefreshTokens =
      await this.usersService.deleteAllRefreshTokens();
    if (deletedRefreshTokens.isErr()) {
      return errAsync(deletedRefreshTokens.error);
    }

    return okAsync(undefined);
  }
}
