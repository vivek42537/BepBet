import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Global singleton pattern to prevent connection exhaustion in serverless
const globalForDb = globalThis as unknown as {
  queryClient: postgres.Sql | undefined;
};

// Transaction pooler connection for queries (port 6543)
// Uses PgBouncer transaction mode - must have prepare: false
export const queryClient =
  globalForDb.queryClient ??
  postgres(process.env.DATABASE_URL!, {
    max: 1, // One connection per serverless function instance
    prepare: false, // Required for PgBouncer transaction mode
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.queryClient = queryClient;
}

// Drizzle ORM instance with schema
export const db = drizzle(queryClient, { schema });
