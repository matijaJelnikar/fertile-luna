import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../api/src/app/app.module';
import { configureApp } from '../../../api/src/app/configure-app';

export interface TestApp {
  app: INestApplication;
  close: () => Promise<void>;
}

/**
 * Boots the real application — the real module graph, the real global pipe, filter and guards —
 * against the throwaway e2e database, whose schema the migrations create.
 *
 * Rate limiting is off by default: every spec drives many requests from one address, and only the
 * throttling spec is actually about the limit.
 */
export const createTestApp = async ({
  throttling = false,
}: { throttling?: boolean } = {}): Promise<TestApp> => {
  const builder = Test.createTestingModule({ imports: [AppModule] });

  if (!throttling) {
    builder.overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true });
  }

  const moduleRef = await builder.compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();

  return { app, close: () => app.close() };
};
