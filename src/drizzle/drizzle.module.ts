import { Module } from '@nestjs/common';
import { drizzleProvider } from './drizzle.provider';
import { DrizzleService } from './drizzle.service';

@Module({
  providers: [...drizzleProvider, DrizzleService],
  exports: [DrizzleService],
})
export class DrizzleModule {}
