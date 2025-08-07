import 'dotenv/config';  // ✅ This loads the .env file
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Ensure the DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create PostgreSQL pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM with schema and pool
export const db = drizzle(pool, { schema });

// ✅ Export the pool for use in other files like storage.ts
export { pool };
