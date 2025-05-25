// src/app/api/completion/route.ts
import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';                     // AI SDK core
import { z } from 'zod';

export const runtime = 'edge';

const bodySchema = z.object({ prompt: z.string().min(1) });

export async function POST(req: NextRequest): Promise<Response> {
  const body = bodySchema.parse(await req.json());
  const { textStream } = await streamText({
    model : openai('gpt-4o-mini'),
    prompt: body.prompt,
  });                                                // streamText→data stream response [oai_citation:1‡AI SDK](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text?utm_source=chatgpt.com)
  return textStream.toDataStreamResponse();
}