import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategies/local.guard';
import { RegisterDto } from './auth.models';
import { JwtAuthGuard } from './strategies/jwt.guard';
import { LocalStrategyRequest } from './strategies/local.strategy';
import { JwtStrategyRequest } from './strategies/jwt.strategy';
import { GoogleAuthGuard } from './strategies/google.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin() {
    return { msg: 'Google Authentication' };
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  handleGoogleRedirect() {
    return { msg: 'OK' };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: LocalStrategyRequest) {
    return this.authService.loginWithPassword(req.user.email, req.user.id);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: JwtStrategyRequest) {
    return req.user;
  }
}
