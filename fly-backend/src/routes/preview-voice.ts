// routes/preview-voice.ts
// -----------------------------------------------------------------------------
// GET /api/preview-voice/:label  →  returns a short MP3 sample
// -----------------------------------------------------------------------------

import { Router } from "express";
import { generateSpeech, VOICES } from "../services/tts.js";

export const voicePreview = Router();
export default voicePreview;

voicePreview.get("/:label", async (req, res) => {
  try {
    const label = req.params.label;
    if (!label) {
      return res.status(400).json({ error: "label param required" });
    }

    // Accept either UI label ("Alex (US)") or raw ID ("alloy")
    const voiceKey = VOICES.includes(label as any) ? label : label;

    const { mp3Buffer, contentType } = await generateSpeech(
      "Hi there! Here's how I sound.",
      voiceKey,
    );

    res.setHeader("Content-Type", contentType);
    res.send(mp3Buffer);
  } catch (err: any) {
    console.error(err);
    res
      .status(400)
      .json({ error: err.message ?? "voice preview failed" });
  }
});
