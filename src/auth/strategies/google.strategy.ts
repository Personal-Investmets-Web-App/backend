import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { envs } from 'src/config/envs';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private authService: AuthService) {
    super({
      clientID: envs.GOOGLE_CLIENT_ID,
      clientSecret: envs.GOOGLE_CLIENT_SECRET,
      callbackURL: envs.GOOGLE_REDIRECT_URI,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    // Check if email is present in profile
    if (!profile.emails || profile.emails.length === 0) {
      this.logger.error('No email found in profile');
      throw new HttpException(
        'No email found in profile',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if email is verified
    const isVerified = profile.emails[0].verified;
    if (!isVerified) {
      this.logger.error('Email not verified');
      throw new HttpException('Email not verified', HttpStatus.BAD_REQUEST);
    }

    // Validate if user is registered
    const registeredUser = await this.authService.validateUser(
      profile.emails[0].value,
    );

    if (registeredUser.isOk()) {
      return registeredUser.value;
    }

    // Se descarta el error de DBError
    if (registeredUser.error.type === 'DB_ERROR') {
      this.logger.error('Error validating user', registeredUser.error);
      throw new HttpException(
        'Error validating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // A este punto, el error es por que el usuario no existe en la DB
    this.logger.log('User not found, creating user');
    // Se crea un nuevo usuario
    const newUser = await this.authService.register({
      email: profile.emails[0].value,
      name: profile.name?.givenName ?? '',
      lastName: profile.name?.familyName ?? '',
      profilePic: profile.photos![0].value ?? undefined,
      registerMethod: 'google',
    });

    // Se valida que el usuario se haya creado correctamente
    if (newUser.isErr()) {
      this.logger.error('Error creating user', newUser.error);
      throw new HttpException('Error creating user', HttpStatus.BAD_REQUEST);
    }

    // Se retorna el nuevo usuario
    return newUser.value;
  }
}
