"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { PEOPLE } from "@/santa.config";
import { pool, ready } from "@/lib/db";
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
  await pool.query("DELETE FROM draw");
  await pool.query("UPDATE users SET password_hash=NULL");
  redirect("/me");
}
