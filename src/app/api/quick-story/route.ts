import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReqBody {
  hero: string;
  theme: 'Adventure' | 'Friendship' | 'Mystery';
}

/* ── naive in-memory rate limit (per Vercel edge instance) ─────────────── */
const BUCKET: Record<string, number> = {};
const TTL = 60_000; // 1 minute

function isRateLimited(ip: string) {
  const now = Date.now();
  const last = BUCKET[ip] ?? 0;
  if (now - last < TTL) return true;
  BUCKET[ip] = now;
  return false;
}

/* ── POST /api/quick-story ─────────────────────────────────────────────── */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 },
    );
  }

  const { hero, theme } = (await req.json()) as ReqBody;

  if (!hero || !theme) {
    return NextResponse.json(
      { error: 'Missing hero or theme.' },
      { status: 400 },
    );
  }

  /* build a 30-second story prompt */
  const prompt = `
Write a short children's bedtime story in 6-8 sentences (~150 words).
Theme: ${theme}. Hero: ${hero}.
Make it positive, imaginative, age-appropriate (ages 4-7).
Return plain text, no markdown.`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 220,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    });

    const story = chat.choices[0]?.message.content?.trim() ?? '';

    return NextResponse.json<{
      story: string;
      audioUrl: null;
    }>({
      story,
      // TODO: call TTS endpoint & return URL. Placeholder null for now.
      audioUrl: null,
    });
  } catch (err) {
    console.error('quick-story error', err);
    return NextResponse.json(
      { error: 'generation-failed' },
      { status: 500 },
    );
  }
}
