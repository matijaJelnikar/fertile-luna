import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { Cycle } from '../../entities/cycle.entity';
import { User } from '../../entities/user.entity';
import { CycleService } from './cycle.service';

const USER = 'user-1' as UUID;
const CYCLE_UUID = 'cycle-1' as UUID;

describe('CycleService', () => {
  let service: CycleService;

  const cycleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const userRepository = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CycleService,
        { provide: getRepositoryToken(Cycle), useValue: cycleRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get(CycleService);
  });

  describe('findOneById', () => {
    it('scopes the lookup by the authenticated user, not by the uuid alone', async () => {
      cycleRepository.findOne.mockResolvedValue({ uuid: CYCLE_UUID });

      await service.findOneById(CYCLE_UUID, USER);

      expect(cycleRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: CYCLE_UUID, user: { uuid: USER } },
      });
    });

    it('does not select the owner, whose row carries the password hash', async () => {
      cycleRepository.findOne.mockResolvedValue({ uuid: CYCLE_UUID });

      await service.findOneById(CYCLE_UUID, USER);

      expect(cycleRepository.findOne.mock.calls[0][0]).not.toHaveProperty(
        'relations'
      );
    });

    it('reports a cycle belonging to someone else as missing', async () => {
      cycleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneById(CYCLE_UUID, USER)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe('findAllByUser', () => {
    it('lists only the caller`s cycles', async () => {
      cycleRepository.find.mockResolvedValue([]);

      await service.findAllByUser(USER);

      expect(cycleRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user: { uuid: USER } } })
      );
    });
  });

  describe('create', () => {
    const dto = { startDate: new Date('2026-01-01'), bleedingLength: 5 };

    it('attaches the authenticated user as the owner', async () => {
      const user = { uuid: USER, password: 'hash' };
      userRepository.findOne.mockResolvedValue(user);
      cycleRepository.create.mockImplementation((value) => ({ ...value }));
      cycleRepository.save.mockImplementation(async (value) => value);

      await service.create(dto, USER);

      expect(cycleRepository.create).toHaveBeenCalledWith({ ...dto, user });
    });

    it('returns the cycle without the owner it was saved with', async () => {
      userRepository.findOne.mockResolvedValue({ uuid: USER, password: 'hash' });
      cycleRepository.create.mockImplementation((value) => ({ ...value }));
      cycleRepository.save.mockImplementation(async (value) => value);

      const created = await service.create(dto, USER);

      expect(created).not.toHaveProperty('user');
      expect(JSON.stringify(created)).not.toContain('hash');
    });

    it('refuses to create a cycle for a user that does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, USER)).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(cycleRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update and delete', () => {
    it('checks ownership before updating', async () => {
      cycleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(CYCLE_UUID, { bleedingLength: 4 }, USER)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(cycleRepository.update).not.toHaveBeenCalled();
    });

    it('checks ownership before deleting', async () => {
      cycleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeCycle(CYCLE_UUID, USER)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(cycleRepository.delete).not.toHaveBeenCalled();
    });
  });
});
