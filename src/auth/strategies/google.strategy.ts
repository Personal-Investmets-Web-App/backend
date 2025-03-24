import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { envs } from 'src/config/envs';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private authService: AuthService) {
    super({
      clientID: envs.GOOGLE_CLIENT_ID,
      clientSecret: envs.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/redirect',
      scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    this.logger.log(accessToken);
    this.logger.log(refreshToken);
    this.logger.log(profile);

    if (!profile.emails || profile.emails.length === 0) {
      this.logger.error('No email found in profile');
      throw new HttpException(
        'No email found in profile',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.authService.validateUser(profile.emails[0].value);
    if (user.isErr()) {
      this.logger.error('Error validating user', user.error);
      return user.error;
    }
    return user.value;
  }
}
