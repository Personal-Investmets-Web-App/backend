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
  UserProfile,
  UserProfileSchema,
} from '../infra/auth.models';

import { LocalAuthGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt.guard';
import { GoogleAuthGuard } from './guards/google.guard';

import { SerializeOutput } from 'src/shared/decorators/serialize-controller';
import { BodyValidationGuard } from 'src/shared/guards/validate-body.guard';
import { ValidateFuncInput } from 'src/shared/decorators/validate-function-input';
import { CRUD_ERRORS } from 'src/shared/errors/crud-erros';
import { REGISTER_METHOD } from 'src/user/domain/user.entities';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin() {
    // Logic Managed by Google Auth Guard, no need to implement
    // Redirects to Google's OAuth page
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  @SerializeOutput(TokensAndUserSchema)
  async handleGoogleRedirect(
    @Request() req: GoogleStrategyRequest,
  ): Promise<TokensAndUserDto> {
    return await this.login(req.user);
  }

  @Post('login')
  @UseGuards(new BodyValidationGuard(LoginSchema), LocalAuthGuard)
  @SerializeOutput(TokensAndUserSchema)
  async localLogin(
    @Request() req: LocalStrategyRequest,
  ): Promise<TokensAndUserDto> {
    return await this.login(req.user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
