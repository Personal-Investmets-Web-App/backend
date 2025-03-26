import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import { UserJwt, UserJwtSchema } from '../auth.models';
import { ValidateFuncInput } from 'src/shared/decorators/validate-function-input';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.REFRESH_JWT_SECRET,
    });
  }

  @ValidateFuncInput(UserJwtSchema)
  validate(payload: UserJwt) {
    return payload;
  }
}
