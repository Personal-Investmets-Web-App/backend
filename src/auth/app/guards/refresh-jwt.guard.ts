import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
Side effect: Appends the user property to the request object
*/
@Injectable()
export class RefreshJwtAuthGuard extends AuthGuard('refresh-jwt') {
  private readonly logger = new Logger(RefreshJwtAuthGuard.name);
  canActivate(context: ExecutionContext) {
    this.logger.log('RefreshJwtAuthGuard');
    return super.canActivate(context);
  }
}
