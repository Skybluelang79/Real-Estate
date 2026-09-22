import serverless from 'serverless-http';
import app, { ensureDb, flushSync } from '../../server/index.js';

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
  const result = await serverlessHandler(event);
  // Serverless functions are frozen once the response returns, so any pending
  // SQLite->Postgres snapshot write must finish before we hand control back.
  try { await flushSync(); } catch (err) { console.log('Postgres flush failed:', err.message); }
  return result;
}
