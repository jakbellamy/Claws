import Link from "next/link";
import { PEOPLE } from "@/santa.config";
import { getSession } from "@/lib/auth";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const me = await getSession();
  return (
    <main>
      <h1>Santa Claws' Secret Santa</h1>
      {me ? <p><Link href="/me">My page ({me})</Link></p> : <LoginForm names={PEOPLE} />}
      <h2>santy claws wish lists</h2>
      <ul>
        {PEOPLE.map((n) => (
          <li key={n}><Link href={`/u/${encodeURIComponent(n)}`}>{n}</Link></li>
        ))}
      </ul>
    </main>
  );
}
