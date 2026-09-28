import mysql from 'mysql2/promise';
import { resolveDbConfig } from './dbConfig.js';

export function createPool() {
  const { appEnv, config } = resolveDbConfig();
  console.log(`Database environment: ${appEnv} (${config.host}:${config.port}/${config.database})`);
  return mysql.createPool(config);
}

export async function waitForDb(pool) {
  const attempts = 30;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query('SELECT 1 FROM tasks LIMIT 1');
      return;
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }

      console.log(`Database not ready (attempt ${attempt}/${attempts})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
