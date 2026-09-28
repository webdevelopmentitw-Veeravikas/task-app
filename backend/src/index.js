import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createPool, waitForDb } from './db.js';
import { createTaskRouter } from './routes/tasks.js';

const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
dotenv.config({ path: envFile });

const port = Number(process.env.PORT || 3001);
const pool = createPool();
const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1 FROM tasks LIMIT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check failed', error);
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api/tasks', createTaskRouter(pool));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

let server;

try {
  await waitForDb(pool);
  server = app.listen(port, '0.0.0.0', () => {
    console.log(`API listening on ${port}`);
  });
} catch (error) {
  console.error('Database connection failed', error);
  process.exit(1);
}

async function shutdown() {
  if (server) {
    server.close();
  }
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
