import { pool, ready } from "@/lib/db";
import { clearFlair, saveFlair } from "@/app/actions";
import FlairCanvas from "./flair-canvas";

export default async function AddFlair({ me }: { me: string }) {
  await ready();
  const { rows } = await pool.query("SELECT image FROM flair WHERE name=$1", [me]);
  const image = rows[0]?.image;
  return (
    <section>
      <h2>add flair</h2>
      {image ? (
        <>
          <p><img src={image} alt="Your flair" width={200} height={200} /></p>
          <details>
            <summary>update flair</summary>
            <FlairCanvas initial={image} save={saveFlair} />
          </details>
          <form action={clearFlair}><p><button>clear flair</button></p></form>
        </>
      ) : (
        <FlairCanvas save={saveFlair} />
      )}
    </section>
  );
}
