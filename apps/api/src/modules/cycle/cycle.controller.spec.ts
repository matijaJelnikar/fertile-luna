import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from 'crypto';
import { AuthenticatedRequest } from '../auth/types/AuthenticatedRequest';
import { CycleController } from './cycle.controller';
import { CycleService } from './cycle.service';

const USER = 'user-1' as UUID;
const CYCLE_UUID = 'cycle-1' as UUID;

const request = { user: { uuid: USER } } as AuthenticatedRequest;

describe('CycleController', () => {
  let controller: CycleController;

  const cycleService = {
    findAllByUser: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    removeCycle: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CycleController],
      providers: [{ provide: CycleService, useValue: cycleService }],
    }).compile();

    controller = module.get(CycleController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  // Every handler passes the uuid from the token, never one taken from the body.
  it('scopes the listing by the authenticated user', async () => {
    await controller.findAll(request);
    expect(cycleService.findAllByUser).toHaveBeenCalledWith(USER);
  });

  it('scopes a read by the authenticated user', async () => {
    await controller.findOne(CYCLE_UUID, request);
    expect(cycleService.findOneById).toHaveBeenCalledWith(CYCLE_UUID, USER);
  });

  it('creates for the authenticated user', async () => {
    const dto = { startDate: new Date('2026-01-01'), bleedingLength: 5 };
    await controller.create(dto, request);
    expect(cycleService.create).toHaveBeenCalledWith(dto, USER);
  });

  it('scopes an update by the authenticated user', async () => {
    await controller.update(CYCLE_UUID, { bleedingLength: 4 }, request);
    expect(cycleService.update).toHaveBeenCalledWith(
      CYCLE_UUID,
      { bleedingLength: 4 },
      USER
    );
  });

  it('scopes a delete by the authenticated user', async () => {
    await controller.remove(CYCLE_UUID, request);
    expect(cycleService.removeCycle).toHaveBeenCalledWith(CYCLE_UUID, USER);
  });
});
