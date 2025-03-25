import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { envs } from 'src/config/envs';
import { DBError } from 'src/users/utils/errors';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
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

    const registeredUser = await this.authService.validateUser(
      profile.emails[0].value,
    );

    if (registeredUser.isOk()) {
      return registeredUser.value;
    }

    // Se descarta el error de DBError
    if (registeredUser.error instanceof DBError) {
      this.logger.error('Error validating user', registeredUser.error);
      throw new HttpException('Error validating user', HttpStatus.BAD_REQUEST);
    }

    // A este punto, el error solo puede ser UserNotFoundError
    this.logger.log('User not found, creating user');
    const newUser = await this.authService.register({
      email: profile.emails[0].value,
      name: profile.displayName,
      profilePic: profile.photos![0].value ?? undefined,
    });

    if (newUser.isErr()) {
      this.logger.error('Error creating user', newUser.error);
      throw new HttpException('Error creating user', HttpStatus.BAD_REQUEST);
    }
    return newUser.value;
  }
}
