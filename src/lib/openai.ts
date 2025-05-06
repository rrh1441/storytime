import OpenAI from "openai";

const { OPENAI_API_KEY = "" } = process.env;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY env var missing");

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// central model IDs so they’re only in one place
export const TEXT_MODEL = "gpt-4o-mini-2024-07-18";
export const TTS_MODEL  = "gpt-4o-mini-tts";
