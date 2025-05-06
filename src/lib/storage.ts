import { randomUUID } from "crypto";
import { supabaseService } from "./supabase";

const BUCKET = (process.env.STORY_AUDIO_BUCKET || "story_assets") as const;

await supabaseService.storage.createBucket(BUCKET, { public: true }).catch(() => {});

export async function uploadAudio(
  filename: string,
  buf: Buffer,
  contentType = "audio/mpeg"
): Promise<string> {
  const objectPath = `${Date.now()}_${randomUUID()}_${filename}`;

  const { error } = await supabaseService.storage
    .from(BUCKET)
    .upload(objectPath, buf, { contentType, upsert: true });

  if (error) throw new Error(`Supabase upload error: ${error.message}`);

  const {
    data: { publicUrl }
  } = supabaseService.storage.from(BUCKET).getPublicUrl(objectPath);

  if (!publicUrl) throw new Error("Failed to obtain public URL");
  return publicUrl;
}
