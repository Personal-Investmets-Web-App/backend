import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class BodyValidationGuard implements CanActivate {
  constructor(private schema: ZodSchema) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    try {
      this.schema.parse(request.body);
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(
          (err) => `${String(err.path)}: ${err.message}`,
        );
        throw new BadRequestException(errorMessages);
      }
      throw new BadRequestException(String(error));
    }
  }
}
