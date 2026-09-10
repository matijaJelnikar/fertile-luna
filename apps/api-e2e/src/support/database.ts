import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

/** A throwaway database, created and dropped around the suite. Never the developer's own. */
export const E2E_DATABASE = 'basal_temp_log_e2e';

export const loadApiEnv = (): void => {
  loadEnv({ path: 'apps/api/.env' });
};

const adminClient = (): Client =>
  new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

const withAdminClient = async (
  run: (client: Client) => Promise<void>
): Promise<void> => {
  const client = adminClient();
  await client.connect();
  try {
    await run(client);
  } finally {
    await client.end();
  }
};

export const createE2eDatabase = (): Promise<void> =>
  withAdminClient(async (client) => {
    await client.query(`DROP DATABASE IF EXISTS "${E2E_DATABASE}"`);
    await client.query(`CREATE DATABASE "${E2E_DATABASE}"`);
  });

export const dropE2eDatabase = (): Promise<void> =>
  withAdminClient(async (client) => {
    await client.query(`DROP DATABASE IF EXISTS "${E2E_DATABASE}"`);
  });
