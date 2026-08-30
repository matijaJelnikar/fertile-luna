import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from 'crypto';
import { AuthenticatedRequest } from '../auth/types/AuthenticatedRequest';
import { MeasurementController } from './measurement.controller';
import { MeasurementService } from './measurement.service';

const request = {
  user: { uuid: 'user-1' as UUID },
} as AuthenticatedRequest;

describe('MeasurementController', () => {
  let controller: MeasurementController;
  const measurementService = {
    createMeasurement: jest.fn(),
    getMeasurementsByCycle: jest.fn(),
    getMeasurementById: jest.fn(),
    updateMeasurement: jest.fn(),
    deleteMeasurement: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeasurementController],
      providers: [
        { provide: MeasurementService, useValue: measurementService },
      ],
    }).compile();

    controller = module.get<MeasurementController>(MeasurementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // The uuid in the URL is attacker-controlled; the user id must come from the JWT.
  it('forwards the authenticated user id when updating', async () => {
    await controller.update(
      'measurement-1' as UUID,
      { temperature: 36.9 },
      request
    );

    expect(measurementService.updateMeasurement).toHaveBeenCalledWith(
      'measurement-1',
      { temperature: 36.9 },
      'user-1'
    );
  });

  it('forwards the authenticated user id when deleting', async () => {
    await controller.delete('measurement-1' as UUID, request);

    expect(measurementService.deleteMeasurement).toHaveBeenCalledWith(
      'measurement-1',
      'user-1'
    );
  });

  it('forwards the authenticated user id when reading a cycle', async () => {
    await controller.getAll('cycle-1' as UUID, request);

    expect(measurementService.getMeasurementsByCycle).toHaveBeenCalledWith(
      'cycle-1',
      'user-1'
    );
  });
});
