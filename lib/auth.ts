import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export function secret() {
  const s = process.env.APP_SECRET;
  if (!s) throw new Error("APP_SECRET not set");
  return s;
}

export const hmac = (data: string) =>
  createHmac("sha256", secret()).update(data).digest("hex");

export const safeEq = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function setSession(name: string) {
  (await cookies()).set("s", `${encodeURIComponent(name)}.${hmac("session|" + name)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 60,
    path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete("s");
}

export async function getSession(): Promise<string | null> {
  const v = (await cookies()).get("s")?.value;
  if (!v) return null;
  const i = v.lastIndexOf(".");
  const name = decodeURIComponent(v.slice(0, i));
  return safeEq(v.slice(i + 1), hmac("session|" + name)) ? name : null;
}
