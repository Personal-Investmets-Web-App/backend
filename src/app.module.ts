import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/app/auth.module';
import { UserModule } from './user/app/user.module';
import { DatabaseModule } from './database/app/database.module';
import { UserController } from './user/app/user.controller';
import { AuthController } from './auth/app/auth.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'graphql/schema.gql',
      playground: true,
    }),
    AuthModule,
    UserModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, UserController, AuthController],
  providers: [AppService],
})
export class AppModule {}
