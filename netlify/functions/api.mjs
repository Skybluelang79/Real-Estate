import serverless from 'serverless-http';
import app, { ensureDb } from '../../server/index.js';

const serverlessHandler = serverless(app);

const FUNCTION_PREFIX = '/.netlify/functions/api';

export async function handler(event) {
  await ensureDb();
  let path = event.path || '/';
  if (path.startsWith(FUNCTION_PREFIX)) {
    const rest = path.slice(FUNCTION_PREFIX.length);
    path = `/api${rest}`;
  }
  if (!path.startsWith('/api')) {
    path = `/api${path}`;
  }
  event.path = path;
  return serverlessHandler(event);
}
