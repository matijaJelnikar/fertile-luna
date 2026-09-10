import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from 'crypto';
import { AccessTokenPayload } from '../modules/auth/types/AccessTokenPayload';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  const appService = { getHello: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    controller = app.get(AppController);
  });

  it('greets using the uuid from the token, never an id from the request', async () => {
    appService.getHello.mockResolvedValue('Hello Ana!');
    const user: AccessTokenPayload = {
      uuid: 'user-1' as UUID,
      email: 'ana@example.test',
    };

    await expect(controller.getHello(user)).resolves.toBe('Hello Ana!');
    expect(appService.getHello).toHaveBeenCalledWith('user-1');
  });
});
