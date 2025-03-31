import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  Redirect,
  Request,
  Res,
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
  UserAndAccessTokenDto,
  UserAndAccessTokenSchema,
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
  UserProfile,
  UserProfileSchema,
} from 'src/user/domain/user.entities';
import { Public } from './decorators/public.decorator';
import { envs } from 'src/config/envs';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('local/login')
  @Public()
  @UseGuards(new BodyValidationGuard(LoginSchema), LocalAuthGuard)
  @SerializeOutput(UserAndAccessTokenSchema)
  async localLogin(
    @Request() req: LocalStrategyRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserAndAccessTokenDto> {
    return await this.login(req.user, res);
  }

  @Post('local/register')
  @Public()
  @UseGuards(new BodyValidationGuard(RegisterWithEmailAndPasswordSchema))
  @SerializeOutput(UserAndAccessTokenSchema)
  async registerWithEmailAndPassword(
    @Body() registerDto: RegisterWithEmailAndPasswordDto,
    @Res() res: Response,
  ): Promise<UserAndAccessTokenDto> {
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

    return await this.login(result.value, res);
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
  async handleGoogleRedirect(
    @Request() req: GoogleStrategyRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.login(req.user, res);
    return {
      url: `${envs.FRONTEND_REDIRECT_URI}?accessToken=${result.accessToken}`,
      statusCode: 302,
    };
  }

  @Post('google/authenticate')
  @SerializeOutput(UserAndAccessTokenSchema)
  async googleCallback(
    @Request() req: JwtStrategyRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserAndAccessTokenDto> {
    return await this.login(req.user, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logOut(
    @Request() req: JwtStrategyRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logOut(req.user);
    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    res.clearCookie('refreshToken');

    return {
      message: 'Logged out successfully',
    };
  }

  @Post('refresh')
  @Public()
  @UseGuards(RefreshJwtAuthGuard)
  @SerializeOutput(UserAndAccessTokenSchema)
  async refresh(
    @Request() req: RefreshJwtStrategyRequest,
  ): Promise<UserAndAccessTokenDto> {
    const result = await this.authService.refreshToken(req.user);
    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    return {
      user: req.user,
      accessToken: result.value.accessToken,
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
  async login(user: UserJwt, res: Response) {
    const tokens = await this.authService.login(user);
    if (tokens.isErr()) {
      this.logger.error(tokens.error);
      throw new InternalServerErrorException();
    }

    res.cookie('refreshToken', tokens.value.refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: envs.REFRESH_COOKIE_EXPIRE_IN_SECONDS * 1000,
    });

    return {
      user: user,
      accessToken: tokens.value.accessToken,
    };
  }
}
