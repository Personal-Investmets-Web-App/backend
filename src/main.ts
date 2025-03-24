import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { envs } from './config/envs';

async function bootstrap() {
  const logger = new Logger('Invest-Control-Backend');

  const app = await NestFactory.create(AppModule);
  await app.listen(envs.PORT);
  logger.log(`Invest Control Backend is running on port ${envs.PORT}`);
}
void bootstrap();
