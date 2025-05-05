'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();

  /* sign-out handler */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign-out error:', error.message);
    else router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F2FCE2] backdrop-blur border-b border-gray-200">
      <nav className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Brand mark */}
        <Link
          href="/"
          className="font-display text-2xl font-extrabold tracking-tight"
          style={{
            background:
              'linear-gradient(90deg,#4FB8FF 0%,#4FB8FF 45%,#FF9F51 55%,#FF9F51 100%)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          StoryTime
        </Link>

        {/* Right-side controls */}
        {loading ? null : user ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-gray-700">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="rounded-full border border-[#8A4FFF] text-[#8A4FFF] hover:bg-[#8A4FFF] hover:text-white px-4 py-1 text-sm transition-colors"
            >
              Log&nbsp;out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-[#8A4FFF] hover:bg-[#7a3dff] text-white px-6 py-2 text-sm font-medium transition-colors"
          >
            Log&nbsp;in
          </Link>
        )}
      </nav>
    </header>
  );
}
