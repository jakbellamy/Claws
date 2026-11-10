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
      );
      CREATE TABLE IF NOT EXISTS wall (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS wall_comments (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES wall(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        body TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id INT NOT NULL REFERENCES wall(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        PRIMARY KEY (post_id, name)
      );
      CREATE TABLE IF NOT EXISTS comment_likes (
        comment_id INT NOT NULL REFERENCES wall_comments(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        PRIMARY KEY (comment_id, name)
      );
      ALTER TABLE wall ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
      ALTER TABLE wall ALTER COLUMN created_at SET DEFAULT now();
      ALTER TABLE wall_comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
      ALTER TABLE wall_comments ALTER COLUMN created_at SET DEFAULT now();`);
    await pool.query(
      `INSERT INTO users (name) SELECT unnest($1::text[]) ON CONFLICT DO NOTHING`,
      [PEOPLE]
    );
  })());
}
