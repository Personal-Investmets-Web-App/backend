import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
Side effect: Appends the user property to the request object
*/
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);
  constructor() {
    super({
      accessType: 'offline',
    });
  }
  canActivate(context: ExecutionContext) {
    this.logger.log('GoogleAuthGuard');
    return super.canActivate(context);
  }
}
