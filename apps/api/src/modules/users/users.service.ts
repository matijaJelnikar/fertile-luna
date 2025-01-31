import { CreateUserDto, UpdateUserDto } from '@basal-temp-log-workspace/model';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { Repository, UpdateResult } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  findOneById(id: UUID): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  create(createUserDto: CreateUserDto): Promise<User> {
    const user: User = new User();
    user.username = createUserDto.username;
    user.age = createUserDto.age;
    user.email = createUserDto.email;
    user.password = createUserDto.password;
    return this.userRepository.save(user);
  }

  update(userId: UUID, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    return this.userRepository.update(userId, updateUserDto);
  }

  removeUser(id: number): Promise<{ affected?: number }> {
    return this.userRepository.delete(id);
  }
}
