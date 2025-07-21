import { openai, TEXT_MODEL } from "@/lib/openai";
// import { createClient } from '@supabase/supabase-js'; // Browser client, not for route handlers
// import { supabaseService } from '@/lib/supabase/service'; // Assuming this is your service role client
// const supabaseService = createClient( // This was likely an incorrect client for a route handler
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );


interface StoryParams {
  storyTitle?: string | null;
  theme: string;
  length: number;           // minutes
  language: string;
  mainCharacter?: string | null;
  educationalFocus?: string | null;
  additionalInstructions?: string | null;
}

function estimateWordCount(minutes: number) {
  const wordsPerMinute = 130;
  const min = 150;
  const max = wordsPerMinute * 75;
  return Math.max(min, Math.min(Math.round(minutes * wordsPerMinute), max));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as StoryParams;
    const { theme, language, length } = body;
    if (!theme || !language || !length || length <= 0)
      return new Response(
        JSON.stringify({ error: "theme, language, length required" }),
        { status: 400 }
      );

    const wordsTarget = estimateWordCount(length);
    const TITLE_MARKER = "Generated Title:";

    const prompt = `Write **in ${language}** a children's story.\n` +
      `Theme: ${theme}.\n` +
      (body.mainCharacter
        ? `Main character: ${body.mainCharacter}.\n`
        : "Use a child protagonist.\n") +
      (body.educationalFocus
        ? `Subtly teach: ${body.educationalFocus}.\n`
        : "") +
      (body.additionalInstructions
        ? `Extra: ${body.additionalInstructions}\n`
        : "") +
      `Target length ≈ ${wordsTarget} words (${length} minutes read).\n` +
      `Positive ending; markdown paragraphs.\n` +
      `After the story output a creative title on its own line prefixed '${TITLE_MARKER}'.`;

    const completion = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const raw = completion.choices[0].message?.content?.trim() || "";
    const markerIdx = raw.lastIndexOf(`\n${TITLE_MARKER}`);
    const story = markerIdx !== -1 ? raw.slice(0, markerIdx).trim() : raw;
    const title =
      body.storyTitle?.trim() ||
      (markerIdx !== -1
        ? raw.slice(markerIdx + TITLE_MARKER.length + 1).trim()
        : `A Story About ${theme}`);

    return new Response(JSON.stringify({ title, story }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    console.error('Error generating story:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
