import Link from "next/link";
import { notFound } from "next/navigation";
import { PEOPLE } from "@/santa.config";
import { pool, ready } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Person({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  if (!PEOPLE.includes(name)) notFound();
  await ready();
  const { rows } = await pool.query("SELECT wishlist FROM users WHERE name=$1", [name]);
  const flair = await pool.query("SELECT image FROM flair WHERE name=$1", [name]);
  return (
    <main>
      <p><Link href="/">{`<-` } home</Link></p>
      <h1>{name}</h1>
      {flair.rows[0] && <img src={flair.rows[0].image} alt={`${name}'s flair`} width={200} height={200} />}
      <h2>santy claws wish list</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{rows[0]?.wishlist || "Nothing yet."}</p>
    </main>
  );
}
