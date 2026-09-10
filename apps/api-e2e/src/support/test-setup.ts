import { E2E_DATABASE, loadApiEnv } from './database';

// Runs in every worker before the test framework. The app reads its configuration through
// ConfigService, which prefers process.env, so pointing it at the throwaway database is enough.
loadApiEnv();
process.env.DB_NAME = E2E_DATABASE;
// The e2e database is created and dropped around the run, so `synchronize` building its schema
// from the entities is exactly right — and it is what local development does too.
process.env.NODE_ENV = 'development';
