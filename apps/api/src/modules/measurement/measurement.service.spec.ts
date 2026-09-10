import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MucusFeelingOption } from '@basal-temp-log-workspace/model';
import { UUID } from 'crypto';
import { Measurement } from '../../entities/measurement.entity';
import { CycleService } from '../cycle/cycle.service';
import { MeasurementService } from './measurement.service';

const USER = 'user-1' as UUID;
const OTHER_USER = 'user-2' as UUID;
const MEASUREMENT_UUID = 'measurement-1' as UUID;

describe('MeasurementService', () => {
  let service: MeasurementService;

  // `findByDay` goes through the query builder, so the day lookup is mocked at its tail.
  const dayLookup = jest.fn();
  const queryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: dayLookup,
  };

  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };

  const cycleService = { findOneById: jest.fn() };
  const CYCLE_UUID = 'cycle-1' as UUID;

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
        { provide: CycleService, useValue: cycleService },
      ],
    }).compile();

    service = module.get(MeasurementService);

    cycleService.findOneById.mockResolvedValue({ uuid: CYCLE_UUID });
    dayLookup.mockResolvedValue(null);
    repository.create.mockImplementation((m) => m);
    repository.save.mockImplementation((m) => Promise.resolve(m));
  });

  describe('createMeasurement', () => {
    it('records a day that has no entry yet', async () => {
      const response = await service.createMeasurement(
        { date: new Date('2026-08-02'), temperature: 36.5 },
        CYCLE_UUID,
        USER
      );

      expect(repository.create).toHaveBeenCalled();
      expect(response).toEqual(
        expect.objectContaining({ temperature: 36.5 })
      );
    });

    it('updates the existing entry when the day is already recorded', async () => {
      dayLookup.mockResolvedValue(ownedMeasurement());

      await service.createMeasurement(
        { date: new Date('2026-08-01'), temperature: 36.9 },
        CYCLE_UUID,
        USER
      );

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          uuid: MEASUREMENT_UUID,
          temperature: 36.9,
        })
      );
    });

    it('leaves observations the client omits untouched when merging a day', async () => {
      dayLookup.mockResolvedValue(ownedMeasurement());

      await service.createMeasurement(
        { date: new Date('2026-08-01'), temperature: 36.9 },
        CYCLE_UUID,
        USER
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'existing note' })
      );
    });

    it('records a day observed without a measurement', async () => {
      const response = await service.createMeasurement(
        { date: new Date('2026-08-02'), mucusFeeling: MucusFeelingOption.Moist },
        CYCLE_UUID,
        USER
      );

      expect(response).toEqual(
        expect.objectContaining({ mucusFeeling: MucusFeelingOption.Moist })
      );
      expect(response.temperature).toBeUndefined();
    });

    it('keeps the value of a measurement marked disturbed', async () => {
      const response = await service.createMeasurement(
        {
          date: new Date('2026-08-02'),
          temperature: 36.42,
          disturbed: true,
          disturbanceReasons: ['late measurement'],
        },
        CYCLE_UUID,
        USER
      );

      expect(response).toEqual(
        expect.objectContaining({ temperature: 36.42, disturbed: true })
      );
    });

    it('refuses to mark a day disturbed when it has no measurement', async () => {
      await expect(
        service.createMeasurement(
          { date: new Date('2026-08-02'), disturbed: true },
          CYCLE_UUID,
          USER
        )
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not leak the joined cycle owner in the response', async () => {
      dayLookup.mockResolvedValue(ownedMeasurement());

      const response = await service.createMeasurement(
        { date: new Date('2026-08-01'), temperature: 36.9 },
        CYCLE_UUID,
        USER
      );

      expect(response).not.toHaveProperty('cycle');
    });
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

    it('refuses to clear the temperature of a day that stays marked disturbed', async () => {
      repository.findOne.mockResolvedValue({
        ...ownedMeasurement(),
        disturbed: true,
      } as unknown as Measurement);

      await expect(
        service.updateMeasurement(MEASUREMENT_UUID, { temperature: null }, USER)
      ).rejects.toBeInstanceOf(BadRequestException);
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
