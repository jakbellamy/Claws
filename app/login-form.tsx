"use client";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm({ names }: { names: string[] }) {
  const [msg, action] = useActionState(login, "");
  return (
    <form action={action}>
      <h2>Sign in / set password</h2>
      <span style={{ color: "red" }}>REMEMBER!!</span><span> IF THIS IS YOUR FIRST TIME, YOU ARE SETTING A PASSWORD!.</span>
      <p>
        <select name="name" required defaultValue="">
          <option value="" disabled>Who are you?</option>
          {names.map((n) => <option key={n}>{n}</option>)}
        </select>
      </p>
      <p><input name="password" type="password" placeholder="password" required /></p>
      <button>Login/Signup</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
