import { createE2eDatabase, loadApiEnv } from './database';

module.exports = async function () {
  loadApiEnv();
  console.log('\nCreating the e2e database...\n');
  await createE2eDatabase();
};
