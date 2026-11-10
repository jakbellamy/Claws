"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PEOPLE } from "@/santa.config";
import { pool, ready } from "@/lib/db";
import { redrawn } from "@/lib/redraw";
import { clearSession, getSession, setSession } from "@/lib/auth";

export async function login(_: string, f: FormData): Promise<string> {
  const name = String(f.get("name"));
  const pw = String(f.get("password"));
  if (!PEOPLE.includes(name) || pw.length < 4) return "Pick a name and a password (4+ chars).";
  await ready();
  const { rows } = await pool.query("SELECT password_hash FROM users WHERE name=$1", [name]);
  const hash: string | null = rows[0]?.password_hash;
  if (!hash) {
    const claimed = await pool.query(
      "UPDATE users SET password_hash=$2 WHERE name=$1 AND password_hash IS NULL",
      [name, await bcrypt.hash(pw, 10)]
    );
    if (!claimed.rowCount) return "Try again.";
  } else if (!(await bcrypt.compare(pw, hash))) {
    return "Wrong password.";
  }
  await setSession(name);
  redirect("/me");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function saveWishlist(f: FormData) {
  const me = await getSession();
  if (!me) redirect("/");
  await pool.query("UPDATE users SET wishlist=$2 WHERE name=$1", [
    me,
    String(f.get("wishlist")).slice(0, 5000),
  ]);
  redirect("/me");
}

export async function resetClaws() {
  const me = await getSession();
  if (!me) redirect("/");
  await ready();
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("DELETE FROM draw");
    await c.query("DELETE FROM redraw_votes");
    await c.query("DELETE FROM flair");
    await c.query("UPDATE users SET password_hash=NULL, wishlist=''");
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function proposeRedraw() {
  const me = await getSession();
  if (!me) redirect("/");
  await ready();
  if (await redrawn()) redirect("/extras");
  await pool.query("INSERT INTO redraw_votes (voter) VALUES ($1) ON CONFLICT DO NOTHING", [me]);
  if (await redrawn()) await pool.query("DELETE FROM draw");
  redirect("/extras");
}

export async function undoRedrawVote() {
  const me = await getSession();
  if (!me) redirect("/");
  await ready();
  if (!(await redrawn())) await pool.query("DELETE FROM redraw_votes WHERE voter=$1", [me]);
  redirect("/extras");
}

export async function saveFlair(image: string) {
  const me = await getSession();
  if (!me) redirect("/");
  if (!image.startsWith("data:image/png;base64,") || image.length > 200000) return;
  await ready();
  await pool.query(
    "INSERT INTO flair (name, image) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET image=$2",
    [me, image]
  );
  redirect(`/u/${encodeURIComponent(me)}`);
}

export async function clearFlair() {
  const me = await getSession();
  if (!me) redirect("/");
  await ready();
  await pool.query("DELETE FROM flair WHERE name=$1", [me]);
  redirect("/extras");
}
