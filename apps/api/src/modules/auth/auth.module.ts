import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  providers: [
    AuthService,
    {
      provide: 'AUTH_CONFIG',
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
