import Link from "next/link";
import { User } from "@supabase/supabase-js";

export default function Navbar({ user }: { user: User | null }) {
  return (
    <nav className="flex items-center justify-between px-4 py-2 border-b">
      <Link href="/" className="text-lg font-semibold">StoryTime</Link>
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm">{user.email}</span>
          <Link href="/logout" className="text-sm underline">Log&nbsp;out</Link>
        </div>
      ) : (
        <Link href="/login" className="text-sm underline">Log&nbsp;in</Link>
      )}
    </nav>
  );
}
