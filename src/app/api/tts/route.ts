import { openai, TTS_MODEL } from "@/lib/openai";
import { uploadAudio }       from "@/lib/storage";

export const runtime = "nodejs";

export const config = {
  runtime: 'nodejs',
};

export async function POST(req: Request) {
  try {
    const { text, voice, language = "English", filename = "speech.mp3" } =
      (await req.json()) as {
        text: string;
        voice: string;
        language?: string;
        filename?: string;
      };

    if (!text?.trim() || !voice)
      return new Response(
        JSON.stringify({ error: "'text' and 'voice' required" }),
        { status: 400 }
      );

    // 1️⃣  ask OpenAI to give MP3 directly (FFmpeg removed)
    const audioRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY as string}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice,
        input: text,
        language,
        response_format: "mp3"
      })
    });

    if (!audioRes.ok) {
      const msg = await audioRes.text().catch(() => "<no-body>");
      throw new Error(`OpenAI TTS ${audioRes.status}: ${msg}`);
    }

    const mp3Buf = Buffer.from(await audioRes.arrayBuffer());

    // 2️⃣  store in Supabase Storage
    const publicUrl = await uploadAudio(filename, mp3Buf);

    return new Response(JSON.stringify({ audioUrl: publicUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("[tts]", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
