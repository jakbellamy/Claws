import { PEOPLE, CANNOT_DRAW } from "@/santa.config";
import { pool, ready } from "./db";
import { hmac, safeEq } from "./auth";

const banned = (a: string, b: string) =>
  a === b || CANNOT_DRAW.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const shuffle = <T,>(a: T[]) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function makeDraw(): Record<string, string> {
  const givers = shuffle(PEOPLE);
  const taken = new Set<string>();
  const result: Record<string, string> = {};
  const go = (i: number): boolean => {
    if (i === givers.length) return true;
    const g = givers[i];
    for (const r of shuffle(PEOPLE)) {
      if (taken.has(r) || banned(g, r) || result[r] === g) continue;
      result[g] = r;
      taken.add(r);
      if (go(i + 1)) return true;
      delete result[g];
      taken.delete(r);
    }
    return false;
  };
  if (!go(0)) throw new Error("No valid draw exists with these rules");
  return result;
}

const h = (giver: string, receiver: string) => hmac(`draw|${giver}|${receiver}`);

export async function whoDidIDraw(me: string): Promise<string | null> {
  await ready();
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(42)");
    const { rows: existing } = await c.query("SELECT giver FROM draw LIMIT 1");
    if (!existing.length) {
      const d = makeDraw();
      for (const [g, r] of Object.entries(d))
        await c.query("INSERT INTO draw (giver, hash) VALUES ($1, $2)", [g, h(g, r)]);
    }
    const { rows } = await c.query("SELECT hash FROM draw WHERE giver = $1", [me]);
    await c.query("COMMIT");
    if (!rows.length) return null;
    return PEOPLE.find((p) => safeEq(h(me, p), rows[0].hash)) ?? null;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
