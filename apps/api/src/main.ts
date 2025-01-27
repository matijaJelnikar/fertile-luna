/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { JwtGuard } from './modules/auth/guards/jwt.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new JwtGuard(app.get(Reflector)));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties that don't have decorators
      forbidNonWhitelisted: true, // Throws error if unknown properties are present
      transform: true, // Automatically transforms input to DTO types
      disableErrorMessages: false, // Ensure validation error messages are shown
    })
  );

  // app.useGlobalFilters({
  //   catch(exception, host) {
  //     const ctx = host.switchToHttp();
  //     const response = ctx.getResponse();
  //     const status = exception.getStatus ? exception.getStatus() : 500;
  //     Logger.error(exception); // Logs the full error
  //     response.status(status).json({
  //       statusCode: status,
  //       message: exception.message || 'Internal server error',
  //     });
  //   },
  // });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Basal temp API spec')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
