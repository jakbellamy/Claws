import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { pool, ready } from "@/lib/db";
import { redrawn } from "@/lib/redraw";
import { whoDidIDraw } from "@/lib/draw";
import { logout, saveWishlist } from "../actions";

export const dynamic = "force-dynamic";

export default async function Me() {
  const me = await getSession();
  if (!me) redirect("/");
  await ready();
  const { rows } = await pool.query("SELECT wishlist FROM users WHERE name=$1", [me]);
  const wishlist = rows[0]?.wishlist?.trim();
  const pt2 = await redrawn();
  const drew = await whoDidIDraw(me);
  return (
    <main>
      <p><Link href="/">{`<-` } home</Link></p>
      <h1>{pt2 ? "You Drew After The Redraw 🥁" : "You Drew 🥁"}</h1>
      <h2>
        {drew ? <Link href={`/u/${encodeURIComponent(drew)}`}>{drew}</Link> : "No draw found"}
      </h2>
      <h2>My santy claws wish list</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{wishlist || "No items in wish list"}</p>
      <details>
        <summary>Edit wish list</summary>
        <form action={saveWishlist}>
          <p><textarea name="wishlist" rows={8} defaultValue={rows[0]?.wishlist ?? ""} style={{ width: "100%" }} /></p>
          <button>Save</button>
        </form>
      </details>
      <form action={logout}><p><button>Sign out</button></p></form>
    </main>
  );
}
