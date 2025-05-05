'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const THEMES = ['Adventure', 'Friendship', 'Mystery'] as const;
type Theme = (typeof THEMES)[number];

export default function QuickWizard() {
  const [hero, setHero] = useState('');
  const [theme, setTheme] = useState<Theme>('Adventure');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* autofocus hero input without scrolling the page */
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  /* form submit */
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStory(null);
    setAudioUrl(null);

    try {
      /* 1) short story */
      const sRes = await fetch('/api/quick-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero, theme }),
      });
      if (!sRes.ok) throw new Error(await sRes.text());
      const { story: text } = (await sRes.json()) as { story: string };
      setStory(text);

      /* 2) narration */
      const aRes = await fetch('/api/quick-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (aRes.ok) {
        const blob = await aRes.blob();
        setAudioUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error(err);
      setError('Whoops—please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="quick-start"
      className="py-20 bg-[#F2FCE2] border-t border-gray-100 scroll-mt-24"
    >
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-10 text-[#4FB8FF]">
          Try it now—30&nbsp;seconds!
        </h2>

        <form
          onSubmit={onSubmit}
          className="space-y-8 rounded-3xl bg-white p-8 shadow-xl"
        >
          {/* hero name */}
          <div>
            <label
              htmlFor="hero"
              className="block text-sm font-medium mb-2 text-gray-700"
            >
              Hero&rsquo;s name
            </label>
            <input
              id="hero"
              ref={inputRef}
              value={hero}
              onChange={(e) => setHero(e.target.value)}
              required
              maxLength={30}
              className="w-full rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4FB8FF]"
              placeholder="e.g. Luna"
            />
          </div>

          {/* theme selector */}
          <div>
            <p className="text-sm font-medium mb-3 text-gray-700">Theme</p>
            <div className="flex gap-4 flex-wrap">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`px-6 py-2 rounded-full border transition-colors ${
                    theme === t
                      ? 'bg-[#4FB8FF] text-white shadow-md'
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
            className="flex items-center gap-2 w-full justify-center rounded-full bg-[#8A4FFF] text-white py-3 text-lg font-medium hover:bg-[#7a3dff] disabled:opacity-60"
          >
            <Sparkles className="h-5 w-5" />
            {loading ? 'Creating…' : 'Create my story'}
          </button>
        </form>

        {/* error */}
        {error && (
          <p className="mt-6 text-red-600 text-center text-sm">{error}</p>
        )}

        {/* result */}
        {story && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-6 text-center text-[#FF9F51]">
              Here&rsquo;s your tale!
            </h3>

            <p className="whitespace-pre-line rounded-3xl bg-white p-8 shadow">
              {story}
            </p>

            {audioUrl && (
              <audio controls src={audioUrl} className="mt-6 w-full" />
            )}

            <div className="mt-12 text-center space-y-5">
              <p className="text-lg">
                Love it? That was just a taste. Sign up for a 3-minute adventure
                and unlock unlimited, longer stories!
              </p>
              <Link
                href="/signup"
                className="inline-block bg-[#4FB8FF] hover:bg-[#4FB8FF]/90 text-white font-medium px-8 py-3 rounded-full shadow-md"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
