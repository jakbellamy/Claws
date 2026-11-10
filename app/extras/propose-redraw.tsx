import { pool, ready } from "@/lib/db";
import { redrawn } from "@/lib/redraw";
import { PEOPLE } from "@/santa.config";
import { proposeRedraw, undoRedrawVote } from "@/app/actions";

export default async function ProposeRedraw({ me }: { me: string }) {
  await ready();
  const { rows } = await pool.query("SELECT voter FROM redraw_votes");
  if (await redrawn()) return <section><h2>Propose redraw</h2><p>Redrawn already.</p></section>;
  const voted = rows.some((r) => r.voter === me);
  return (
    <section>
      <h2>propose redraw</h2>
      <p>{rows.length} of {PEOPLE.length} votes (redraw triggerd after over half votes for it)</p>
      <form action={voted ? undoRedrawVote : proposeRedraw}><button>{voted ? "Undo vote" : "Vote to redraw"}</button></form>
    </section>
  );
}
