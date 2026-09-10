import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';

export const GLOBAL_PREFIX = 'api';

/**
 * Everything that makes a bare Nest app *this* API. `main.ts` and the e2e harness both call it, so
 * a test cannot pass against a laxer pipe or a different error shape than production runs.
 */
export const configureApp = (app: INestApplication): INestApplication => {
  const config = app.get(ConfigService);

  app.setGlobalPrefix(GLOBAL_PREFIX);

  // Health data: only the origins we ship the client from may read a response.
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:4200')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties that don't have decorators
      forbidNonWhitelisted: true, // Throws error if unknown properties are present
      transform: true, // Automatically transforms input to DTO types
      disableErrorMessages: false, // Ensure validation error messages are shown
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  return app;
};
