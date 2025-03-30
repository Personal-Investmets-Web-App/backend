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
  TokensAndUserDto,
  TokensAndUserSchema,
  UserJwt,
  UserJwtSchema,
} from '../infra/auth.models';

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

  @Get('google/login')
  @Public()
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin() {
    // Logic Managed by Google Auth Guard, no need to implement
    // Redirects to Google's OAuth page
  }

  @Get('google/redirect')
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

  @Post('login')
  @Public()
  @UseGuards(new BodyValidationGuard(LoginSchema), LocalAuthGuard)
  @SerializeOutput(TokensAndUserSchema)
  async localLogin(
    @Request() req: LocalStrategyRequest,
  ): Promise<TokensAndUserDto> {
    return await this.login(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logOut(@Request() req: JwtStrategyRequest) {
    const result = await this.authService.logOut(req.user);
    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    return {
      message: 'Logged out successfully',
    };
  }

  @Post('register/email')
  @Public()
  @UseGuards(new BodyValidationGuard(RegisterWithEmailAndPasswordSchema))
  @SerializeOutput(TokensAndUserSchema)
  async registerWithEmailAndPassword(
    @Body() registerDto: RegisterWithEmailAndPasswordDto,
  ): Promise<TokensAndUserDto> {
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

    return this.login(result.value);
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

  @Post('refresh')
  @Public()
  @UseGuards(RefreshJwtAuthGuard)
  @SerializeOutput(TokensAndUserSchema)
  async refresh(
    @Request() req: RefreshJwtStrategyRequest,
  ): Promise<TokensAndUserDto> {
    const result = await this.authService.refreshToken(req.user);
    if (result.isErr()) {
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    return {
      user: req.user,
      accessToken: result.value.accessToken,
      refreshToken: result.value.refreshToken,
    };
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
}
