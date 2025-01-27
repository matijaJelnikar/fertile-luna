import { Controller, Get } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  async getHello(@User() user): Promise<string> {
    return await this.appService.getHello(user.id);
  }
}
