import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { z } from 'zod';

export const runtime = 'edge';

const bodySchema = z.object({
  text: z.string().min(1),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = bodySchema.parse(await req.json());
    
    // Split text into chunks for streaming
    const sentences = body.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    
    // Group sentences into reasonable chunks (about 100 chars each)
    let currentChunk = '';
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > 100 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence.trim();
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim() + '.');
    }

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // Generate audio for this chunk
            const openai = getOpenAIClient();
            const mp3 = await openai.audio.speech.create({
              model: 'tts-1',
              voice: body.voice,
              input: chunk,
              response_format: 'mp3',
            });

            // Convert to buffer
            const buffer = Buffer.from(await mp3.arrayBuffer());
            
            // Send as base64 encoded chunk with metadata
            const chunkData = {
              index: i,
              total: chunks.length,
              text: chunk,
              audio: buffer.toString('base64'),
              isLast: i === chunks.length - 1
            };
            
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`));
            
            // Small delay between chunks to prevent overwhelming
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Streaming TTS error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}