import { Injectable, NotFoundException } from '@nestjs/common';
import { UUID } from 'crypto';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class AppService {
  constructor(private usersService: UsersService) {}

  async getHello(userUuid: UUID): Promise<string> {
    const user = await this.usersService.findOneById(userUuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return `Hello ${user.username}!`;
  }
}
