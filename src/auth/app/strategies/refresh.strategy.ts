import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { envs } from 'src/config/envs';
import { UserJwt, UserJwtSchema } from '../../infra/auth.models';
import { ValidateFuncInput } from 'src/shared/app/decorators/validate-function-input';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: (request: Request) => {
        let refreshToken: string | null = null;
        if (request && request.cookies) {
          refreshToken = request.cookies['refreshToken'] as string;
        }
        return refreshToken;
      },
      ignoreExpiration: false,
      secretOrKey: envs.REFRESH_JWT_SECRET,
      passReqToCallback: true,
    });
  }

  @ValidateFuncInput(UserJwtSchema, 1)
  async validate(req: Request, payload: UserJwt) {
    const refreshToken = req.cookies['refreshToken'] as string;
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const result = await this.authService.validateRefreshToken(
      payload.id,
      refreshToken,
    );

    if (result.isErr()) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
