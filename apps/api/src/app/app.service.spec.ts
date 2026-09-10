import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UUID } from 'crypto';
import { UsersService } from '../modules/users/users.service';
import { AppService } from './app.service';

const USER_UUID = 'user-1' as UUID;

describe('AppService', () => {
  let service: AppService;
  const usersService = { findOneById: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const app = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = app.get(AppService);
  });

  it('greets the authenticated user by name', async () => {
    usersService.findOneById.mockResolvedValue({ username: 'Ana' });

    await expect(service.getHello(USER_UUID)).resolves.toBe('Hello Ana!');
    expect(usersService.findOneById).toHaveBeenCalledWith(USER_UUID);
  });

  it('reports a missing user rather than failing on the lookup', async () => {
    usersService.findOneById.mockResolvedValue(null);

    await expect(service.getHello(USER_UUID)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
