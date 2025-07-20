// src/app/actions.ts
'use server';

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';
import { Buffer } from 'buffer';

/*──────────────────────  env  ──────────────────────*/
const supabaseUrl            = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey           = process.env.OPENAI_API_KEY!;
if (!supabaseUrl || !supabaseServiceRoleKey || !openaiApiKey) {
  throw new Error('Missing required env vars');
}

/*────────────────────── clients ────────────────────*/
const openai          = new OpenAI({ apiKey: openaiApiKey });
const supabaseService = createServiceRoleClient(supabaseUrl, supabaseServiceRoleKey);

/*────────────────────── schema  ────────────────────*/
const storySchema = z.object({
  theme                 : z.string().min(1),
  length                : z.number().min(3).max(60),
  language              : z.string().min(1),
  mainCharacter         : z.string().max(50).optional().nullable(),
  educationalFocus      : z.string().optional().nullable(),
  additionalInstructions: z.string().max(500).optional().nullable(),
});
type StoryParams = z.infer<typeof storySchema>;

/*────────────────────── helpers ────────────────────*/
const wordsPerMinute = 130;
const estimateWordCount = (minutes: number) =>
  Math.max(150, Math.round(minutes * wordsPerMinute));

/*──────────────────── story action ─────────────────*/
export async function generateStoryAction(
  data: StoryParams,
): Promise<{ story?: string; title?: string; storyId?: string; error?: string }> {
  const parsed = storySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors.map(e => e.message).join(', ') };
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated.' };

  const {
    theme,
    length,
    language,
    mainCharacter,
    educationalFocus,
    additionalInstructions,
  } = parsed.data;

  const TITLE_MARK = 'Generated Title:';
  const prompt = [
    `Write **in ${language}** a children's story (~${estimateWordCount(length)} words).`,
    `Theme: ${theme}.`,
    mainCharacter ? `Main character: ${mainCharacter}.` : 'Use a child protagonist.',
    educationalFocus ? `Teach: ${educationalFocus}.` : '',
    additionalInstructions ? `Notes: ${additionalInstructions}.` : '',
    'Positive ending. Markdown paragraphs.',
    `After the story output a creative title prefixed with "${TITLE_MARK}" on its own line.`,
  ]
    .filter(Boolean)
    .join(' ');

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const raw = resp.choices[0].message?.content?.trim() ?? '';
    if (!raw) throw new Error('OpenAI returned empty content');

    const titleMatch = raw.match(new RegExp(`${TITLE_MARK}\\s*(.+)$`, 'm'));
    const title = titleMatch ? titleMatch[1].trim() : `A ${theme} Story`;
    const story = titleMatch
      ? raw.replace(new RegExp(`${TITLE_MARK}.*`, 'm'), '').trim()
      : raw.trim();

    const { data: inserted, error } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        title,
        content: story,
        theme,
        language,
        length_minutes: length,
        main_character: mainCharacter,
        ...(educationalFocus && { educational_focus: educationalFocus }),
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);

    return { story, title, storyId: inserted.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[generateStoryAction]', err);
    return { error: err.message || 'Story generation failed.' };
  }
}

/*────────────────────  TTS action  ─────────────────*/
interface GenerateTtsParams {
  text: string;
  voiceId: string;
  language: string;
  storyId: string;
}

export async function generateTtsAction(
  p: GenerateTtsParams,
): Promise<{ audioUrl?: string; error?: string }> {
  if (!p.text || !p.voiceId || !p.storyId) return { error: 'Missing params' };

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated.' };

  try {
    const res = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: p.voiceId as OpenAI.Audio.SpeechCreateParams['voice'],
      input: p.text,
      response_format: 'mp3',
    });
    const mp3Buffer = Buffer.from(await res.arrayBuffer());

    const bucket = 'story_assets';
    const path = `audio/${p.storyId}-${Date.now()}.mp3`;
    const { error: uploadError } = await supabaseService.storage
      .from(bucket)
      .upload(path, mp3Buffer, { contentType: 'audio/mpeg', upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabaseService.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('No public URL');
    const audioUrl = data.publicUrl;

    await supabase
      .from('stories')
      .update({ audio_url: audioUrl, updated_at: new Date().toISOString() })
      .eq('id', p.storyId)
      .eq('user_id', user.id);

    return { audioUrl };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[generateTtsAction]', err);
    return { error: err.message || 'TTS failed.' };
  }
}