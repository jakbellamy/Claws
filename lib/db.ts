import { Pool } from "pg";
import { PEOPLE } from "@/santa.config";

const g = globalThis as unknown as { pool?: Pool; ready?: Promise<void> };

export const pool = (g.pool ??= new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
}));

// Creates tables + seeds names on first use.
export function ready() {
  return (g.ready ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        name TEXT PRIMARY KEY,
        password_hash TEXT,
        wishlist TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS draw (
        giver TEXT PRIMARY KEY,
        hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS redraw_votes (
        voter TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS flair (
        name TEXT PRIMARY KEY,
        image TEXT NOT NULL
      );`);
    await pool.query(
      `INSERT INTO users (name) SELECT unnest($1::text[]) ON CONFLICT DO NOTHING`,
      [PEOPLE]
    );
  })());
}
