import { dropE2eDatabase, loadApiEnv } from './database';

module.exports = async function () {
  loadApiEnv();
  console.log('\nDropping the e2e database...\n');
  await dropE2eDatabase();
};
