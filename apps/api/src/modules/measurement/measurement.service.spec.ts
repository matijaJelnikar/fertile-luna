import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { Measurement } from '../../entities/measurement.entity';
import { CycleService } from '../cycle/cycle.service';
import { MeasurementService } from './measurement.service';

const USER = 'user-1' as UUID;
const OTHER_USER = 'user-2' as UUID;
const MEASUREMENT_UUID = 'measurement-1' as UUID;

describe('MeasurementService', () => {
  let service: MeasurementService;
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
  };

  const ownedMeasurement = () =>
    ({
      uuid: MEASUREMENT_UUID,
      date: new Date('2026-08-01'),
      temperature: 36.5,
      notes: 'existing note',
      cycle: { uuid: 'cycle-1', user: { uuid: USER } },
    } as unknown as Measurement);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasurementService,
        { provide: getRepositoryToken(Measurement), useValue: repository },
        { provide: CycleService, useValue: { findOneById: jest.fn() } },
      ],
    }).compile();

    service = module.get(MeasurementService);
  });

  describe('updateMeasurement', () => {
    it('scopes the lookup to the authenticated user', async () => {
      repository.findOne.mockResolvedValue(ownedMeasurement());
      repository.save.mockImplementation((m) => Promise.resolve(m));

      await service.updateMeasurement(
        MEASUREMENT_UUID,
        { temperature: 36.9 },
        USER
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          uuid: MEASUREMENT_UUID,
          cycle: { user: { uuid: USER } },
        },
      });
    });

    it('rejects a measurement belonging to another user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMeasurement(
          MEASUREMENT_UUID,
          { temperature: 36.9 },
          OTHER_USER
        )
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('writes null through so a field can be cleared', async () => {
      repository.findOne.mockResolvedValue(ownedMeasurement());
      repository.save.mockImplementation((m) => Promise.resolve(m));

      await service.updateMeasurement(MEASUREMENT_UUID, { notes: null }, USER);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ notes: null })
      );
    });

    it('does not leak the joined cycle owner in the response', async () => {
      repository.findOne.mockResolvedValue(ownedMeasurement());
      repository.save.mockImplementation((m) => Promise.resolve(m));

      const response = await service.updateMeasurement(
        MEASUREMENT_UUID,
        { temperature: 36.9 },
        USER
      );

      expect(response).not.toHaveProperty('cycle');
    });
  });

  describe('deleteMeasurement', () => {
    it('removes a measurement the user owns', async () => {
      const measurement = ownedMeasurement();
      repository.findOne.mockResolvedValue(measurement);

      await service.deleteMeasurement(MEASUREMENT_UUID, USER);

      expect(repository.remove).toHaveBeenCalledWith(measurement);
    });

    it('refuses to delete another user\'s measurement', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteMeasurement(MEASUREMENT_UUID, OTHER_USER)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getMeasurementsByCycle', () => {
    it('scopes the cycle lookup to the authenticated user', async () => {
      repository.find.mockResolvedValue([]);

      await service.getMeasurementsByCycle('cycle-1' as UUID, USER);

      expect(repository.find).toHaveBeenCalledWith({
        where: { cycle: { uuid: 'cycle-1', user: { uuid: USER } } },
      });
    });

    it('does not leak the joined cycle owner in the response', async () => {
      repository.find.mockResolvedValue([ownedMeasurement()]);

      const response = await service.getMeasurementsByCycle(
        'cycle-1' as UUID,
        USER
      );

      expect(response[0]).not.toHaveProperty('cycle');
    });
  });
});
