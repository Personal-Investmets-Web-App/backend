import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
Side effect: Appends the user property to the request object
*/
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  private readonly logger = new Logger(LocalAuthGuard.name);
  canActivate(context: ExecutionContext) {
    this.logger.log('LocalAuthGuard');
    return super.canActivate(context);
  }
}
