// src/app/actions.ts
'use server'; // Mark this file as Server Actions

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'; // Server client for auth/db
// Ensure you have the service role key set for storage uploads if RLS restricts them
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';
import { Buffer } from 'buffer'; // Node.js Buffer

// --- Environment Variables Check ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needed for storage uploads potentially
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || !openaiApiKey) {
  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabaseServiceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    !openaiApiKey && "OPENAI_API_KEY",
  ].filter(Boolean).join(', ');
  console.error(`Missing critical environment variables: ${missing}`);
  // Throw an error during build or startup if critical keys are missing
  if (typeof window === 'undefined') { // Avoid throwing during client-side rendering attempts
      throw new Error(`Server configuration error: Missing environment variables (${missing})`);
  }
}

// --- Initialize Clients ---
const openai = new OpenAI({ apiKey: openaiApiKey });
// Service Role Client (use cautiously, only when necessary like storage uploads bypassing RLS)
// Ensure RLS is properly configured for user uploads if not using service role.
const supabaseService = createServiceRoleClient(supabaseUrl!, supabaseServiceRoleKey!);


// --- Zod Schema (Mirroring the one from create-story page) ---
const storyParamsSchema = z.object({
  theme: z.string().min(1, 'Theme is required.'),
  length: z.number().min(3).max(60), // Assuming length is in minutes
  language: z.string().min(1, 'Language is required.'), // Add validation if needed
  mainCharacter: z.string().max(50).optional().nullable(),
  educationalFocus: z.string().optional().nullable(),
  additionalInstructions: z.string().max(500).optional().nullable(),
});

type StoryParams = z.infer<typeof storyParamsSchema>;


// --- Helper Function: Estimate Word Count ---
function estimateWordCount(minutes: number): number {
  const wordsPerMinute = 130;
  const minWords = 150;
  const maxWords = wordsPerMinute * 75;
  const calculatedWords = Math.round(minutes * wordsPerMinute);
  return Math.max(minWords, Math.min(calculatedWords, maxWords));
}


// --- Server Action: Generate Story ---
export async function generateStoryAction(
  formData: StoryParams
): Promise<{ story?: string; title?: string; storyId?: string; error?: string }> {
  console.log('[generateStoryAction] Received form data:', formData);

  // Validate input
  const validation = storyParamsSchema.safeParse(formData);
  if (!validation.success) {
    console.error('[generateStoryAction] Validation failed:', validation.error.errors);
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { error: `Invalid input: ${errorMessages}` };
  }

  const supabase = createServerSupabaseClient(); // Standard server client for user context
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[generateStoryAction] Authentication error:', authError);
    return { error: 'User not authenticated.' };
  }
  console.log(`[generateStoryAction] User authenticated: ${user.id}`);

  try {
    // 1. Construct Prompt
    const { theme, length, language, mainCharacter, educationalFocus, additionalInstructions } = validation.data;
    const targetWordCount = estimateWordCount(length);
    const TITLE_MARKER = "Generated Title: ";
    const characterDesc = mainCharacter ? ` The main character is named ${mainCharacter}.` : " The story features a child protagonist.";
    const eduFocus = educationalFocus ? ` Subtly incorporate the theme of ${educationalFocus}.` : "";
    const addInstr = additionalInstructions ? ` Additional user requests: ${additionalInstructions}` : "";

    const prompt = `Write **in ${language}** a children's story suitable for young children.
The story should have a theme of ${theme}.${characterDesc}
The target length is approximately ${targetWordCount} words (about ${length} minutes read aloud).${eduFocus}${addInstr}
Ensure the story ends on a positive note and is formatted using Markdown paragraphs (use line breaks between paragraphs).

After the story, output a creative title **in ${language}** on a separate line starting with '${TITLE_MARKER}'. Do not include anything else after the title line.`;

    console.log('[generateStoryAction] Sending prompt to OpenAI...');

    // 2. Call OpenAI Chat Completions API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use the specified model for story generation
      messages: [{ role: 'user', content: prompt }],
      max_tokens: Math.round(targetWordCount * 1.5) + 100,
      temperature: 0.7,
    });

    console.log('[generateStoryAction] Received response from OpenAI.');
    const raw = completion.choices[0]?.message?.content ?? "";
    if (!raw) {
      throw new Error('OpenAI returned an empty response.');
    }

    // 3. Extract Story and Title
    let story = raw.trim();
    let title = "";
    const titleMarkerIndex = raw.lastIndexOf(`\n${TITLE_MARKER}`);
    if (titleMarkerIndex !== -1) {
      title = raw.slice(titleMarkerIndex + TITLE_MARKER.length + 1).trim();
      story = raw.slice(0, titleMarkerIndex).trim();
    } else {
      console.warn('[generateStoryAction] Title marker not found. Using fallback title.');
      title = language === "English" ? `A ${theme} Story` : `Story about ${theme}`;
      story = raw.trim(); // Use full response as story
    }
    story = story.replace(/^#\s+/, ''); // Remove leading markdown H1
    console.log(`[generateStoryAction] Extracted Title: "${title}", Story Length: ${story.length} chars`);

    // 4. Insert into Supabase 'stories' table
    console.log('[generateStoryAction] Inserting story into Supabase...');
    const insertPayload: Record<string, string | number | boolean | undefined | null> = {
        user_id: user.id,
        title: title,
        content: story,
        theme: theme,
        language: language,
        length_minutes: length,
        main_character: mainCharacter,
        // Only include optional fields if they have a value
        ...(educationalFocus && { educational_focus: educationalFocus }),
        // created_at and updated_at should be handled by DB defaults/triggers
    };

    const { data: newStoryData, error: insertError } = await supabase
      .from('stories')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError) {
      console.error('[generateStoryAction] Supabase insert error:', insertError);
      throw new Error(`Failed to save story: ${insertError.message}`);
    }
    if (!newStoryData?.id) {
      throw new Error('Failed to retrieve story ID after insertion.');
    }

    console.log(`[generateStoryAction] Story inserted successfully. ID: ${newStoryData.id}`);
    return { story, title, storyId: newStoryData.id };

  } catch (error: unknown) {
    console.error('[generateStoryAction]', error);
    return { error: (error as Error).message || 'Failed to generate story' };
  }
}


// --- Server Action: Generate TTS Audio ---
interface GenerateTtsParams {
  text: string;
  voiceId: "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer" | string; // More specific or just string
  language: string;
  storyId: string;
}

export async function generateTtsAction(
  params: GenerateTtsParams
): Promise<{ audioUrl?: string; error?: string }> {
  console.log('[generateTtsAction] Received params:', params);

  // Basic validation
  if (!params.text || !params.voiceId || !params.storyId) {
      return { error: 'Missing required parameters: text, voiceId, or storyId.' };
  }
   // Validate voice ID against known OpenAI voices
   const validVoices = ["alloy", "echo", "fable", "nova", "onyx", "shimmer"];
   if (!validVoices.includes(params.voiceId)) {
       // Note: We are using gpt-4o-mini-tts model, but the 'voice' parameter still expects one of the standard voice IDs.
       // The model choice itself enables potential tone control, not the voice parameter changing.
       console.warn(`[generateTtsAction] voiceId '${params.voiceId}' is not one of the standard voices, but proceeding with gpt-4o-mini-tts model.`);
       // Allow non-standard voice IDs if you intend to use custom voice cloning features later,
       // but for standard voices, it should be one of the above.
       // For now, we'll proceed but keep the validation check commented out or adjusted based on actual usage.
       // return { error: `Invalid voiceId: ${params.voiceId}` };
   }


  const supabase = createServerSupabaseClient(); // Standard client for user check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[generateTtsAction] Authentication error:', authError);
    return { error: 'User not authenticated.' };
  }
   console.log(`[generateTtsAction] User authenticated: ${user.id}`);

  try {
    // 1. Call OpenAI TTS API
    console.log(`[generateTtsAction] Requesting TTS from OpenAI (model: gpt-4o-mini-tts) for story ${params.storyId}...`);
    const speechResponse = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts', // *** USE gpt-4o-mini-tts AS REQUESTED ***
      voice: params.voiceId as "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer", // Cast to known voices
      input: params.text,
      response_format: 'mp3', // Request MP3 directly, avoids ffmpeg
      // Add additional parameters here if controlling tone, e.g.:
      // prompt: "Speak in a calm, soothing bedtime story voice." // Example - check exact API parameter if available
    });

    console.log(`[generateTtsAction] Received TTS response from OpenAI.`);

    // 2. Get MP3 Buffer
    const mp3Buffer = Buffer.from(await speechResponse.arrayBuffer());
    console.log(`[generateTtsAction] MP3 Buffer created, size: ${mp3Buffer.length} bytes.`);


    // 3. Upload to Supabase Storage
    const bucket = 'story_assets'; // Ensure this bucket exists and has appropriate policies
    const filePath = `audio/${params.storyId}-${Date.now()}.mp3`; // Unique path per generation
    console.log(`[generateTtsAction] Uploading to Supabase Storage: ${bucket}/${filePath}`);

    // Use the Service Role client for upload to bypass RLS if needed
    const { error: uploadError } = await supabaseService.storage
      .from(bucket)
      .upload(filePath, mp3Buffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[generateTtsAction] Supabase upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    console.log(`[generateTtsAction] Upload successful.`);

    // 4. Get Public URL
    console.log(`[generateTtsAction] Retrieving public URL...`);
    const { data: urlData } = supabaseService.storage // Use service client again
      .from(bucket)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error('[generateTtsAction] Failed to get public URL after upload.');
      throw new Error('Failed to get public URL after upload.');
    }
    const publicUrl = urlData.publicUrl;
    console.log(`[generateTtsAction] Public URL: ${publicUrl}`);

    // 5. Update Story Record in Database
    console.log(`[generateTtsAction] Updating story record ${params.storyId} with audio URL...`);
    const { error: updateError } = await supabase // Use standard client for DB update (respects RLS)
      .from('stories')
      .update({ audio_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', params.storyId)
      .eq('user_id', user.id); // IMPORTANT: Ensure the authenticated user owns the story

    if (updateError) {
      console.warn(`[generateTtsAction] Failed to update story ${params.storyId} in DB:`, updateError);
    } else {
        console.log(`[generateTtsAction] Story record updated successfully.`);
    }

    return { audioUrl: publicUrl };

  } catch (err: unknown) {
    console.error('[generateTtsAction Error]', err);
     const error = err as { response?: { status: number; data: unknown }, message?: string }; // Type assertion
     if (error.response) {
        console.error('OpenAI API Error Status:', error.response.status);
        console.error('OpenAI API Error Data:', error.response.data);
    }
    return { error: error.message || 'An unexpected error occurred during audio generation.' };
  }
}
