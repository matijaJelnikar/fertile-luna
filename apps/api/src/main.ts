import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { GLOBAL_PREFIX, configureApp } from './app/configure-app';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const port = app.get(ConfigService).get<number>('PORT') ?? 3000;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Basal temp API spec')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('cycle')
    .addTag('measurement')
    .build();
  SwaggerModule.setup(
    `${GLOBAL_PREFIX}/docs`,
    app,
    SwaggerModule.createDocument(app, swaggerConfig)
  );

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`
  );
}

bootstrap();
