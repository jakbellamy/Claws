import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { pool, ready } from "@/lib/db";
import { addComment, postToWall, removeFromWall, toggleLike } from "@/app/actions";
import FlairCanvas from "../extras/flair-canvas";

const when = (d: Date | null) =>
  d
    ? d
        .toLocaleString("en-US", {
          timeZone: "America/New_York",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })
        .toLowerCase()
    : "";

function Like({ kind, id, n, liked }: { kind: string; id: number; n: number; liked: boolean }) {
  return (
    <form action={toggleLike} style={{ display: "inline" }}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <button>{liked ? "unlike" : "like"} ({n})</button>
    </form>
  );
}

export const dynamic = "force-dynamic";

export default async function WallOfFlare() {
  const me = await getSession();
  if (!me) redirect("/");
  await ready();
  const { rows } = await pool.query(
    `SELECT w.id, w.name, w.image, w.created_at,
      (SELECT count(*)::int FROM post_likes WHERE post_id=w.id) AS likes,
      EXISTS (SELECT 1 FROM post_likes WHERE post_id=w.id AND name=$1) AS liked
     FROM wall w ORDER BY w.id DESC`,
    [me]
  );
  const { rows: comments } = await pool.query(
    `SELECT c.id, c.post_id, c.name, c.body, c.created_at,
      (SELECT count(*)::int FROM comment_likes WHERE comment_id=c.id) AS likes,
      EXISTS (SELECT 1 FROM comment_likes WHERE comment_id=c.id AND name=$1) AS liked
     FROM wall_comments c ORDER BY c.id`,
    [me]
  );
  return (
    <main>
      <p><Link href="/extras">← extras</Link></p>
      <h1>wall of flare</h1>
      <details>
        <summary>add to the wall</summary>
        <FlairCanvas save={postToWall} label="post" />
      </details>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {rows.map((r) => (
          <figure key={r.id} style={{ margin: 0, width: 220 }}>
            <img src={r.image} alt={`${r.name}'s flare`} width={200} height={200} />
            <figcaption>
              {r.name}
              {r.name === me && (
                <form action={removeFromWall} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={r.id} />
                  {" "}<button>remove</button>
                </form>
              )}
              <br /><small>{when(r.created_at)}</small>
              {" "}<Like kind="post" id={r.id} n={r.likes} liked={r.liked} />
            </figcaption>
            {comments.filter((c) => c.post_id === r.id).map((c) => (
              <p key={c.id} style={{ margin: "4px 0" }}>
                <b>{c.name}</b> {c.body} <small>{when(c.created_at)}</small> <Like kind="comment" id={c.id} n={c.likes} liked={c.liked} />
              </p>
            ))}
            <form action={addComment}>
              <input type="hidden" name="id" value={r.id} />
              <input name="body" placeholder="comment" maxLength={500} style={{ width: 150 }} />{" "}
              <button>send</button>
            </form>
          </figure>
        ))}
      </div>
    </main>
  );
}
