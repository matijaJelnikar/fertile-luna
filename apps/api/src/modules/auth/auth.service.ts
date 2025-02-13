import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginResponse } from '@basal-temp-log-workspace/model';
import { UUID } from 'crypto';
import { UpdateResult } from 'typeorm';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { User } from '../../entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user: User = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isMatch: boolean = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password does not match');
    }
    return user;
  }

  async login(user: User): Promise<LoginResponse> {
    const payload = { email: user.email, uuid: user.uuid };
    return {
      access_token: this.jwtService.sign(payload),
      profileIncomplete: user.profileIncomplete,
    };
  }

  async register(user: CreateUserDto): Promise<LoginResponse> {
    const existingUser = await this.usersService.findOneByEmail(user.email);
    if (existingUser) {
      throw new BadRequestException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser: User = { ...user, password: hashedPassword };
    await this.usersService.create(newUser);
    return this.login(newUser);
  }

  async update(
    userUuid: UUID,
    updateUser: UpdateUserDto
  ): Promise<UpdateResult> {
    const user = await this.usersService.findOneById(userUuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersService.update(userUuid, updateUser);
  }
}
