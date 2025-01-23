import { redirect } from "next/navigation";

export default function Home() {
  return (
    <div>
      <h1>Hello World</h1>
      <button onClick={() => redirect('/dashboard')}>Dashboard</button>
    </div>
  );
}
