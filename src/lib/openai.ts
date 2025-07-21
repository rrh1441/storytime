import OpenAI from "openai";

const { OPENAI_API_KEY = "" } = process.env;

export function getOpenAIClient() {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY env var missing");
  }
  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

// For compatibility with existing code
export const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// central model IDs so they’re only in one place
export const TEXT_MODEL = "gpt-4o-mini-2024-07-18";
export const TTS_MODEL  = "gpt-4o-mini-tts";
