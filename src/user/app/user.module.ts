import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/app/database.module';
import { UserRepositoryDatabase } from '../infra/repositories/user.repository-db';
import { UserRefreshTokenRepositoryDatabase } from '../infra/repositories/user.refresh-token-repository-db';
import { UserResolver } from './user.resolver';
@Module({
  imports: [DatabaseModule],
  providers: [
    UserService,
    UserRepositoryDatabase,
    UserRefreshTokenRepositoryDatabase,
    UserResolver,
  ],
  exports: [UserService, UserResolver],
})
export class UserModule {}
