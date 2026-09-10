import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../decorators/user.decorator';
import { AccessTokenPayload } from '../modules/auth/types/AccessTokenPayload';
import { AppService } from './app.service';

@ApiBearerAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  async getHello(@User() user: AccessTokenPayload): Promise<string> {
    return await this.appService.getHello(user.uuid);
  }
}
