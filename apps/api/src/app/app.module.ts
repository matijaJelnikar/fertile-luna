import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { AuthModule } from '../modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'matija',
      password: 'kokodanda', // Your MySQL password
      database: 'basal_temp_db', // Your database name
      entities: [UserEntity], // Specify your entities here
      synchronize: true, // Set to false in production; true for development
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
