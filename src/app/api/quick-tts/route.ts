/* Edge-runtime route: POST { text: string }  →  MP3 audio */
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Body { text: string }

export async function POST(req: Request) {
  const { text } = (await req.json()) as Body;

  if (!text || text.length > 1_000) {
    return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
  }

  try {
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',           // pick any default narrator
      format: 'mp3',
      input: text,
    });

    /* OpenAI returns a fetch Response-like object with a readable stream. */
    const mp3 = await speech.arrayBuffer();

    return new NextResponse(mp3, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        // cache ~1 day (safe; text is short and deterministic)
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err) {
    console.error('quick-tts error', err);
    return NextResponse.json({ error: 'tts-failed' }, { status: 500 });
  }
}
