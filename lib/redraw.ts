import { PEOPLE } from "@/santa.config";
import { pool, ready } from "./db";

export async function redrawn() {
  await ready();
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM redraw_votes");
  return rows[0].n > PEOPLE.length / 2;
}
