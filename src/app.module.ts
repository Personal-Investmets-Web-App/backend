import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/app/auth.module';
import { UserModule } from './user/app/user.module';
import { DatabaseModule } from './database/app/database.module';
import { UserController } from './user/app/user.controller';
import { AuthController } from './auth/app/auth.controller';

@Module({
  imports: [AuthModule, UserModule, DatabaseModule],
  controllers: [AppController, UserController, AuthController],
  providers: [AppService],
})
export class AppModule {}
