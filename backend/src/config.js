import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawDbPath = process.env.DB_PATH || './data/habits.db';
const parsedPort = Number.parseInt(process.env.PORT || '5000', 10);

export const config = {
  port: Number.isFinite(parsedPort) ? parsedPort : 5000,
  host: process.env.HOST || '0.0.0.0',
  dbPath: path.isAbsolute(rawDbPath) ? rawDbPath : path.resolve(backendRoot, rawDbPath),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development'
};
