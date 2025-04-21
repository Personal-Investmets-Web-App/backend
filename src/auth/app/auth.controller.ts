import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  Redirect,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import {
  GoogleStrategyRequest,
  JwtStrategyRequest,
  LocalStrategyRequest,
  LoginSchema,
  RefreshJwtStrategyRequest,
  RegisterWithEmailAndPasswordDto,
  RegisterWithEmailAndPasswordSchema,
  UserAndTokensDto,
  UserAndTokensSchema,
  UserJwt,
  UserJwtSchema,
} from '../infra/auth.models';
import { Response } from 'express';

import { LocalAuthGuard } from './guards/local.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt.guard';
import { GoogleAuthGuard } from './guards/google.guard';

import { SerializeOutput } from 'src/shared/app/decorators/serialize-controller';
import { BodyValidationGuard } from 'src/shared/app/guards/validate-body.guard';
import { ValidateFuncInput } from 'src/shared/app/decorators/validate-function-input';
import { CRUD_ERRORS } from 'src/shared/infra/errors/crud-erros';
import {
  REGISTER_METHOD,
  ROLE,
  UserProfile,
  UserProfileSchema,
} from 'src/user/domain/user.entities';
import { Public } from './decorators/public.decorator';
import { envs } from 'src/config/envs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Roles } from './decorators/roles.decorator';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('local/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(new BodyValidationGuard(LoginSchema), LocalAuthGuard)
  @SerializeOutput(UserAndTokensSchema)
  async localLogin(
    @Request() req: LocalStrategyRequest,
  ): Promise<UserAndTokensDto> {
    return await this.login(req.user);
  }

  @Post('local/register')
  @Public()
  @UseGuards(new BodyValidationGuard(RegisterWithEmailAndPasswordSchema))
  @SerializeOutput(UserAndTokensSchema)
  async registerWithEmailAndPassword(
    @Body() registerDto: RegisterWithEmailAndPasswordDto,
  ): Promise<UserAndTokensDto> {
    const result = await this.authService.register({
      ...registerDto,
      registerMethod: REGISTER_METHOD.EMAIL,
    });

    if (result.isErr()) {
      if (result.error.type === CRUD_ERRORS.ALREADY_EXISTS) {
        throw new BadRequestException(result.error.type);
      }
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    return await this.login(result.value);
  }

  @Post('google/login')
  @Public()
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin() {
    // Logic Managed by Google Auth Guard, no need to implement
    // Redirects to Google's OAuth page
  }

  @Post('google/redirect')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Redirect(`${envs.FRONTEND_REDIRECT_URI}}`, 302)
  async handleGoogleRedirect(@Request() req: GoogleStrategyRequest) {
    const result = await this.login(req.user);
    return {
      url: `${envs.FRONTEND_REDIRECT_URI}?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      statusCode: 302,
    };
  }

  @Post('google/authenticate')
  @SerializeOutput(UserAndTokensSchema)
  async googleCallback(
    @Request() req: JwtStrategyRequest,
  ): Promise<UserAndTokensDto> {
    return await this.login(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logOut(
    @Request() req: JwtStrategyRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    return {
      message: 'Logged out successfully',
    };
  }

  @Post('refresh')
  @Public()
  @UseGuards(RefreshJwtAuthGuard)
  @SerializeOutput(UserAndTokensSchema)
  async refresh(
    @Request() req: RefreshJwtStrategyRequest,
  ): Promise<UserAndTokensDto> {
    const result = await this.authService.refreshToken(req.user);
    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    if (!('refreshToken' in req.cookies)) {
      this.logger.error('Refresh token not found in cookies');
      throw new UnauthorizedException();
    }

    const refreshToken = req.cookies['refreshToken'];

    return {
      user: req.user,
      accessToken: result.value.accessToken,
      refreshToken,
    };
  }

  @Get('profile')
  @SerializeOutput(UserProfileSchema)
  async getProfile(@Request() req: JwtStrategyRequest): Promise<UserProfile> {
    const result = await this.authService.validateUser(req.user.email);

    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    return result.value;
  }

  @ValidateFuncInput(UserJwtSchema)
  async login(user: UserJwt) {
    const tokens = await this.authService.login(user);
    if (tokens.isErr()) {
      this.logger.error(tokens.error);
      throw new InternalServerErrorException();
    }

    return {
      user: user,
      accessToken: tokens.value.accessToken,
      refreshToken: tokens.value.refreshToken,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cronDeleteExpiredRefreshTokens() {
    const result = await this.authService.deleteExpiredRefreshTokens();
    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    return {
      message: 'Expired refresh tokens deleted successfully',
    };
  }

  @Delete('expired-refresh-tokens')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLE.ADMIN)
  async deleteExpiredRefreshTokens() {
    const result = await this.authService.deleteExpiredRefreshTokens();
    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    return {
      message: 'Expired refresh tokens deleted successfully',
    };
  }

  @Delete('refresh-tokens')
  @HttpCode(HttpStatus.OK)
  async deleteAllRefreshTokens() {
    const result = await this.authService.deleteAllRefreshTokens();
    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    return {
      message: 'All refresh tokens deleted successfully',
    };
  }
}
