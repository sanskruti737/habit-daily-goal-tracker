import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { validationError } from './middleware/validation.js';
import { createHabitRoutes, createStatsRoutes } from './routes/habits.js';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendDist = path.resolve(backendRoot, '../frontend/dist');

export function createApp(db) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.clientUrl }));
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/habits', createHabitRoutes(db));
  app.use('/api/stats', createStatsRoutes(db));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
    app.use(express.static(frontendDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Malformed JSON body' });
      return;
    }

    const status = error.status || 500;
    if (status >= 500) {
      console.error(error);
    }

    res.status(status).json({
      error: status >= 500 ? 'Internal server error' : error.message
    });
  });

  return app;
}

export { validationError };
