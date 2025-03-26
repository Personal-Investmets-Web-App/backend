import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
  UserProfile,
  UserProfileSchema,
} from './auth.models';

import { LocalAuthGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt.guard';
import { GoogleAuthGuard } from './guards/google.guard';

import { SerializeOutput } from 'src/shared/decorators/serialize-controller';
import { BodyValidationGuard } from 'src/shared/guards/validate-body.guard';

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
  handleGoogleRedirect(
    @Request() req: GoogleStrategyRequest,
  ): TokensAndUserDto {
    const token = this.authService.login(req.user);
    return {
      user: req.user,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
    };
  }

  @Post('login')
  @UseGuards(new BodyValidationGuard(LoginSchema), LocalAuthGuard)
  @SerializeOutput(TokensAndUserSchema)
  login(@Request() req: LocalStrategyRequest): TokensAndUserDto {
    const token = this.authService.login(req.user);
    return {
      user: req.user,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
    };
  }

  @Post('register/email')
  @UseGuards(new BodyValidationGuard(RegisterWithEmailAndPasswordSchema))
  async registerWithEmailAndPassword(
    @Body() registerDto: RegisterWithEmailAndPasswordDto,
  ): Promise<TokensAndUserDto> {
    const result = await this.authService.register({
      ...registerDto,
      registerMethod: 'email',
    });

    if (result.isErr()) {
      if (result.error.type === 'ALREADY_EXISTS') {
        throw new BadRequestException(result.error.type);
      }
      this.logger.error(result.error);
      throw new InternalServerErrorException();
    }

    const token = this.authService.login(result.value);

    return {
      user: result.value,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @SerializeOutput(UserProfileSchema)
  async getProfile(@Request() req: JwtStrategyRequest): Promise<UserProfile> {
    const result = await this.authService.validateUser(req.user.email);

    if (result.isErr()) {
      throw new InternalServerErrorException();
    }

    return result.value;
  }

  @Post('refresh')
  @UseGuards(RefreshJwtAuthGuard)
  @SerializeOutput(TokensAndUserSchema)
  refresh(@Request() req: RefreshJwtStrategyRequest): TokensAndUserDto {
    const result = this.authService.refreshToken(req.user);
    return {
      user: req.user,
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }
}
