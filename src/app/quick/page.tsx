'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const THEMES = ['Adventure', 'Friendship', 'Mystery'] as const;
type Theme = (typeof THEMES)[number];

export default function QuickPage() {
  const [hero, setHero] = useState('');
  const [theme, setTheme] = useState<Theme>('Adventure');

  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------- submit handler ------------------------------------------------ */
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStory(null);
    setAudioUrl(null);

    try {
      /* 1) get story text */
      const r1 = await fetch('/api/quick-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero, theme }),
      });
      if (!r1.ok) throw new Error(await r1.text());
      const { story: text } = (await r1.json()) as { story: string };

      setStory(text);

      /* 2) convert to speech */
      const r2 = await fetch('/api/quick-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (r2.ok) {
        const blob = await r2.blob();
        setAudioUrl(URL.createObjectURL(blob));
      } else {
        console.warn('TTS failed (non-fatal):', await r2.text());
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again in a minute.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ----------------------------------------------------------- */
  return (
    <main className="container mx-auto px-6 py-16 max-w-3xl">
      <h1 className="text-4xl font-display font-bold mb-8 text-center">
        Your 30-Second Story
      </h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* hero name */}
        <div>
          <label htmlFor="hero" className="block text-sm font-medium mb-1">
            Hero’s name
          </label>
          <input
            id="hero"
            value={hero}
            onChange={(e) => setHero(e.target.value)}
            required
            maxLength={30}
            className="w-full rounded border px-3 py-2"
            placeholder="e.g. Luna"
          />
        </div>

        {/* theme buttons */}
        <div>
          <p className="text-sm font-medium mb-2">Theme</p>
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-full border ${
                  theme === t
                    ? 'bg-[#4FB8FF] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#8A4FFF] text-white hover:bg-[#7a3dff] disabled:opacity-60"
        >
          <Sparkles className="h-5 w-5" />
          {loading ? 'Creating…' : 'Create my story'}
        </button>
      </form>

      {/* error */}
      {error && (
        <p className="mt-6 text-red-600 text-sm text-center">{error}</p>
      )}

      {/* result */}
      {story && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Here’s your tale!</h2>

          <p className="whitespace-pre-line rounded-lg bg-white p-6 shadow">
            {story}
          </p>

          {audioUrl && (
            <audio controls src={audioUrl} className="mt-4 w-full" />
          )}

          {/* upsell */}
          <div className="mt-10 text-center space-y-4">
            <p className="text-lg">
              Like what you hear? That was just a preview. Sign up to get a full
              3-minute adventure—and unlock longer stories anytime.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-[#4FB8FF] hover:bg-[#4FB8FF]/90 text-white font-medium px-6 py-3 rounded-full"
            >
              Sign Up Free
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
