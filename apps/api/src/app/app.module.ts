import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../database/entities';
import { AuthModule } from '../modules/auth/auth.module';
import { JwtGuard } from '../modules/auth/guards/jwt.guard';
import { CycleModule } from '../modules/cycle/cycle.module';
import { MeasurementModule } from '../modules/measurement/measurement.module';
import { UsersModule } from '../modules/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Paths are relative to the workspace root, which is the cwd every Nx target runs from.
      envFilePath: ['apps/api/.env', '.env'],
    }),
    // The default budget every route inherits. The unauthenticated routes narrow it further.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        database: configService.get<string>('DB_NAME'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        entities,
        // A schema derived from the entities at startup can drop a column without saying so.
        // It stays available locally, where losing one costs nothing, and nowhere else.
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        // Migrations are an explicit deploy step (`nx run api:migration-run`), never something
        // the app does while booting: two instances starting at once would race on them.
        migrationsRun: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    MeasurementModule,
    CycleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
