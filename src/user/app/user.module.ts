import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/app/database.module';
import { UserRepositoryDatabase } from '../infra/repositories/user.repository-db';
@Module({
  imports: [DatabaseModule],
  providers: [UserService, UserRepositoryDatabase],
  exports: [UserService],
})
export class UserModule {}
