import { resetClaws } from "../actions";

export default function ResetClaws() {
  return (
    <main>
      <h1>Redraw everyone?</h1>
      <form action={resetClaws}>
        <button>Yes</button>
      </form>
    </main>
  );
}
