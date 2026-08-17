// server/database.js
// Database abstraction layer — supports SQLite (dev) and PostgreSQL (production)
import { initDb, getDb } from './db.js';

const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;

let pool = null;

async function getPool() {
  if (!pool && isProduction) {
    const { default: pg } = await import('pg');
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query(text, params = []) {
  if (isProduction) {
    const client = await getPool().connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  } else {
    // SQLite fallback
    const db = getDb();
    const stmt = db.prepare(text);
    if (params.length) stmt.bind(params);
    if (text.trimStart().toUpperCase().startsWith('SELECT')) {
      stmt.step();
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return { rows };
    } else {
      stmt.step();
      stmt.free();
      return { rows: [], changes: db.getRowsModified() };
    }
  }
}

export async function initDatabase() {
  if (isProduction) {
    const client = await getPool().connect();
    try {
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          avatar TEXT,
          phone TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS properties (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          address TEXT,
          city TEXT,
          state TEXT,
          zip TEXT,
          bedrooms INTEGER,
          bathrooms INTEGER,
          area INTEGER,
          type TEXT,
          status TEXT DEFAULT 'active',
          images TEXT,
          features TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        -- Add other tables as needed
      `);
    } finally {
      client.release();
    }
  } else {
    initDb();
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}