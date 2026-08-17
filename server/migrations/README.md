# Database Migration Guide

## Local Development (SQLite)
No migration needed. The app uses `sql.js` automatically.

## Production (PostgreSQL)

### Setup
1. Create a PostgreSQL database (e.g., on Supabase, Neon, Railway, or Render)
2. Set `DATABASE_URL` environment variable
3. Run the migration:
   ```bash
   psql $DATABASE_URL -f server/migrations/001_initial_schema.sql
   ```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/dbname`)
- `NODE_ENV`: Set to `production` to use PostgreSQL

### Migration Files
- `001_initial_schema.sql`: Initial schema with all tables and indexes