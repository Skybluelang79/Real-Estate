import serverless from 'serverless-http';
import app, { ensureDb } from '../../server/index.js';

const serverlessHandler = serverless(app);

export async function handler(event) {
  await ensureDb();
  let path = event.path || '/';
  // If Netlify passes the full function URL, strip it so only the API route remains.
  path = path.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '');
  // Collapse any duplicated '/api' prefix (e.g. '/api/api/auth/login').
  path = path.replace(/^(\/api)+(?=\/)/, '/api');
  // Ensure the route starts with exactly one '/api'.
  if (!/^\/api(\/|$)/.test(path)) {
    path = path === '/' || path === '' ? '/api' : `/api${path}`;
  }
  event.path = path;
  return serverlessHandler(event);
}
