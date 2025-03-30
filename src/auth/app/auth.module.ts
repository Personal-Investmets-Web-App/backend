import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/app/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { envs } from 'src/config/envs';
import { GoogleStrategy } from './strategies/google.strategy';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    GoogleStrategy,
  ],
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: envs.JWT_SECRET,
      signOptions: { expiresIn: envs.JWT_EXPIRE_IN },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
