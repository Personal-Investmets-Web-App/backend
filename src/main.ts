import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { envs } from './config/envs';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Invest-Control-Backend');

  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.use(cookieParser());
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  await app.listen(envs.PORT);
  logger.log(`Invest Control Backend is running on port ${envs.PORT}`);
}
void bootstrap();
