// services/tts.ts  •  2025-05-06
// -----------------------------------------------------------------------------
// Text-to-speech helper for StoryTime – MP3-only (no FFmpeg)
// Uses OpenAI gpt-4o-mini-tts and uploads the MP3 to Supabase Storage.
// -----------------------------------------------------------------------------

import { randomUUID } from "crypto";
import { uploadAudio } from "./storage.js";

const { OPENAI_API_KEY = "" } = process.env;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY env var not set");

/* ── Voice catalogue ─────────────────────────────────────────────────────── */

export const VOICES = [
  "alloy",   // Alex (US)
  "ash",     // Avery (US)
  "ballad",  // Bella (US)
  "coral",   // Chloe (US)
  "echo",    // Ethan (US)
  "fable",   // Felix (UK)
  "onyx",    // Oscar (US)
  "nova",    // Nora (US)
  "sage",    // Sage (US)
  "shimmer", // Selina (US)
  "verse",   // Victor (US)
] as const;

export type VoiceId = (typeof VOICES)[number];

/** UI-label → OpenAI voice ID */
const LABEL_TO_ID: Record<string, VoiceId> = {
  "Alex (US)":   "alloy",
  "Avery (US)":  "ash",
  "Bella (US)":  "ballad",
  "Chloe (US)":  "coral",
  "Ethan (US)":  "echo",
  "Felix (UK)":  "fable",
  "Oscar (US)":  "onyx",
  "Nora (US)":   "nova",
  "Sage (US)":   "sage",
  "Selina (US)": "shimmer",
  "Victor (US)": "verse",
};

export interface SpeechGenerationResult {
  mp3Buffer: Buffer;
  publicUrl: string;
  contentType: "audio/mpeg";
}

/**
 * Convert `text` to speech and store the MP3 publicly.
 *
 * `uiVoiceLabel` may be either the friendly UI label (e.g. "Alex (US)")
 * or the raw OpenAI voice ID (e.g. "alloy").
 */
export async function generateSpeech(
  text: string,
  uiVoiceLabel: string,
  language: string = "English"
): Promise<SpeechGenerationResult> {
  /* ── resolve voice ID ──────────────────────────────────────────────────── */
  const voiceId = LABEL_TO_ID[uiVoiceLabel] ?? (uiVoiceLabel as VoiceId);
  if (!VOICES.includes(voiceId)) {
    throw new Error(`Unsupported voice: ${uiVoiceLabel}`);
  }

  /* ── 1️⃣  OpenAI TTS → MP3 buffer ───────────────────────────────────────── */
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: voiceId,
      input: text,
      language,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "<no-body>");
    throw new Error(`OpenAI TTS ${res.status}: ${res.statusText}\n${msg}`);
  }
  const mp3Buffer = Buffer.from(await res.arrayBuffer());

  /* ── 2️⃣  Upload MP3 to Supabase Storage ────────────────────────────────── */
  const publicUrl = await uploadAudio(`${randomUUID()}.mp3`, mp3Buffer);

  return { mp3Buffer, publicUrl, contentType: "audio/mpeg" };
}
