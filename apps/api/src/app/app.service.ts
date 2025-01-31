import { Injectable } from '@nestjs/common';
import { UUID } from 'crypto';
import { User } from '../entities/user.entity';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class AppService {
  constructor(private usersService: UsersService) {}
  async getHello(userId: UUID): Promise<string> {
    const user: User = await this.usersService.findOneById(userId);
    return `Hello ${user.username}!`;
  }
}
