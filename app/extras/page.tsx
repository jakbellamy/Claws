import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions";
import ProposeRedraw from "./propose-redraw";
import AddFlair from "./add-flair";

const EXTRAS = [ProposeRedraw, AddFlair];

export const dynamic = "force-dynamic";

export default async function Extras() {
  const me = await getSession();
  if (!me) redirect("/");
  return (
    <main>
      <p><Link href="/">{`<-` } home</Link></p>
      <h1>santys extra stuff</h1>
      {EXTRAS.map((E, i) => <E key={i} me={me} />)}
      <p>merry cristmas, that's all 4 extras</p>
    </main>
  );
}