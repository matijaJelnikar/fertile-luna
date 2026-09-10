import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { entities } from './entities';

loadEnv({ path: join(__dirname, '..', '..', '.env') });

/**
 * Data source for the TypeORM CLI (`nx run api:migration-generate|migration-run|migration-revert`).
 *
 * Migrations are a deploy step, not something the running app does, so only the CLI loads them —
 * and the CLI runs under ts-node, where an ordinary glob works.
 *
 * There are no migrations yet: nothing is deployed and the data is disposable, so local development
 * builds the schema with `synchronize`. Generate the first one before the first real deployment.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities,
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
});
