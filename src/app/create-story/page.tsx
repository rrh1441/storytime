// src/app/create-story/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompletion } from 'ai/react';           // ← official AI SDK import
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card, CardHeader, CardFooter, CardTitle, CardContent,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Loader2, Check, Play, Mic, PlayCircle, PauseCircle,
  Copy as CopyIcon, Download as DownloadIcon, Link as LinkIcon,
  Headphones, Share2, PenTool, Edit,
} from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { generateTtsAction } from '@/app/actions';

/*──────── schema ────────*/
const formSchema = z.object({
  hero        : z.string().min(1, 'Hero is required.'),
  theme       : z.string().min(1, 'Theme is required.'),
  extraDetails: z.string().max(500).optional().nullable(),
  length      : z.number().min(1).max(60),
});
type FormValues = z.infer<typeof formSchema>;
type Step = 'outline' | 'edit' | 'voice' | 'share';

/*──────── constants ─────*/
const LENGTH_OPTIONS  = [3, 5, 10, 15] as const;
const SUPPORTED_VOICES = [
  { id: 'alloy', label: 'Alex (US)'  },
  { id: 'fable', label: 'Felix (UK)' },
  { id: 'nova',  label: 'Nora (US)'  },
] as const;
const PREVIEW_BUCKET = process.env.NEXT_PUBLIC_VOICE_PREVIEW_BUCKET ?? 'voice-previews';

/*──────── component ─────*/
export default function CreateStoryPage() {
  /* form */
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { hero: '', theme: '', extraDetails: null, length: 3 },
  });

  /* story generation */
  const {
    completion,
    complete,
    isLoading: isGenerating,
    error    : genError,
  } = useCompletion({
    api           : '/api/completion',
    streamProtocol: 'text',
  });

  /* local state */
  const [step,         setStep]         = useState<Step>('outline');
  const [storyText,    setStoryText]    = useState('');
  const [selectedVoice,setSelectedVoice]= useState<string>();
  const [audioUrl,     setAudioUrl]     = useState<string | null>(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isStreamingTTS, setIsStreamingTTS] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  /* stream → textarea */
  useEffect(() => { setStoryText(completion); }, [completion]);

  /* build prompt */
  const buildPrompt = (v: FormValues) => {
    const extra = v.extraDetails ? ` Additional details: ${v.extraDetails}.` : '';
    return [
      `Write a children's story (~${v.length} minutes to read) with a positive tone.`,
      `Hero: ${v.hero}`,
      `Theme: ${v.theme}.`,
      extra,
      'Return ONLY the story text without title.',
    ].join('\n');
  };

  /* generate story */
  const handleGenerate = async (values: FormValues) => {
    setAudioUrl(null);
    setSelectedVoice(undefined);
    await complete(buildPrompt(values));
    if (genError) {
      toast({ title: 'Generation failed', description: genError.message, variant: 'destructive' });
    } else {
      setStep('edit');
    }
  };

  /* Streaming TTS */
  const startStreamingTTS = async () => {
    if (!selectedVoice || !storyText.trim()) return;
    
    setIsStreamingTTS(true);
    setStreamingProgress(0);
    
    try {
      const response = await fetch('/api/streaming-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: storyText,
          voice: selectedVoice,
        }),
      });

      if (!response.body) throw new Error('No response stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setStreamingProgress((data.index + 1) / data.total * 100);
                
                // Start playing first chunk immediately
                if (data.index === 0) {
                  playAudioChunk(data.audio);
                }
                
                // Queue subsequent chunks
                if (data.index > 0) {
                  setTimeout(() => playAudioChunk(data.audio), data.index * 2000);
                }
                
                if (data.isLast) {
                  setStep('share');
                  toast({ title: 'Narration ready', description: 'Streaming audio complete!', variant: 'success' });
                }
              } catch (e) {
                console.error('Failed to parse chunk:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Streaming TTS error:', error);
      toast({ title: 'TTS error', description: 'Failed to stream audio', variant: 'destructive' });
    } finally {
      setIsStreamingTTS(false);
    }
  };

  /* Play audio chunk */
  const playAudioChunk = (base64Audio: string) => {
    try {
      const audioBlob = new Blob([
        Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.play().catch(console.error);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  };

  /* TTS */
  const ttsMutation = useMutation({
    mutationFn: async () => {
      const res = await generateTtsAction({
        text    : storyText,
        voiceId : selectedVoice!,
        language: 'English',   // placeholder language
        storyId : 'local',     // placeholder (no DB row from streaming flow)
      });
      if (res.error || !res.audioUrl) throw new Error(res.error ?? 'TTS failed');
      return res.audioUrl;
    },
    onSuccess: (url) => {
      setAudioUrl(url);
      setStep('share');
      toast({ title: 'Narration ready', description: 'Audio generation finished.', variant: 'success' });
    },
    onError: (e: Error) => toast({ title: 'TTS error', description: e.message, variant: 'destructive' }),
  });

  /* playback */
  const togglePlay = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else           { audioRef.current.play().then(() => setIsPlaying(true)); }
  };

  /* preview voice */
  const playPreview = (id: string) => {
    setSelectedVoice(id);
    audioRef.current?.pause(); setIsPlaying(false);
    const supa = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    if (!supa) {
      toast({ title: 'Config error', description: 'SUPABASE URL missing', variant: 'destructive' });
      return;
    }
    const url = `${supa}/storage/v1/object/public/${PREVIEW_BUCKET}/${id}.mp3`;
    if (!previewRef.current) previewRef.current = new Audio();
    previewRef.current.src = url;
    previewRef.current.play().catch(() => toast({ title: 'Preview error', description: 'Cannot play sample', variant: 'destructive' }));
  };

  /*──────── render ────────*/
  return (
    <div className="min-h-screen bg-[#F9FAFC] py-10">
      <div className="container mx-auto px-4">
        <h1 className="mb-6 text-3xl font-bold text-gray-700">Storytime Creator</h1>

        <Tabs value={step} onValueChange={(v: string) => setStep(v as Step)}>
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="outline"><PenTool className="mr-1 h-4 w-4" />Outline</TabsTrigger>
            <TabsTrigger value="edit"   disabled={!storyText}><Edit className="mr-1 h-4 w-4" />Edit</TabsTrigger>
            <TabsTrigger value="voice"  disabled={!storyText}><Headphones className="mr-1 h-4 w-4" />Voice</TabsTrigger>
            <TabsTrigger value="share"  disabled={!audioUrl}><Share2 className="mr-1 h-4 w-4" />Share</TabsTrigger>
          </TabsList>

          {/* Outline */}
          <TabsContent value="outline">
            <Card>
              <CardHeader><CardTitle>Story Outline</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
                  <div>
                    <Label>Hero <span className="text-red-500">*</span></Label>
                    <Input {...form.register('hero')} placeholder="e.g. Luna the Rabbit" />
                  </div>
                  <div>
                    <Label>Theme <span className="text-red-500">*</span></Label>
                    <Input {...form.register('theme')} placeholder="e.g. Friendship" />
                  </div>
                  <div>
                    <Label>Extra details</Label>
                    <Textarea rows={4} {...form.register('extraDetails')} placeholder="Any special requests…" />
                  </div>
                  <div>
                    <Label>Length (minutes)</Label>
                    <RadioGroup
                      value={String(form.watch('length'))}
                      onValueChange={(v: string) => form.setValue('length', Number(v))}
                      className="flex gap-4"
                    >
                      {LENGTH_OPTIONS.map(n => (
                        <div key={n} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(n)} id={`len-${n}`} />
                          <Label htmlFor={`len-${n}`}>{n}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Button type="submit" disabled={!form.formState.isValid || isGenerating} className="w-full bg-[#4FB8FF] text-white">
                    {isGenerating
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
                      : 'Generate Story'}
                  </Button>
                </form>
                {genError && <p className="text-sm text-red-600">{genError.message}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit */}
          <TabsContent value="edit">
            <Card>
              <CardHeader><CardTitle>Edit Story</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Textarea
                  rows={20}
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  className="resize-y min-h-[300px]"
                />
                <article className="prose prose-sm max-w-none h-[calc(20rem+112px)] overflow-y-auto rounded-md border bg-background p-4">
                  {storyText.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                </article>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setStep('voice')} disabled={!storyText.trim()} className="ml-auto bg-[#4FB8FF] text-white">
                  Continue to Voice
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Voice */}
          <TabsContent value="voice">
            <Card>
              <CardHeader><CardTitle>Select Voice</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {SUPPORTED_VOICES.map(v => (
                    <Button
                      key={v.id}
                      variant={selectedVoice === v.id ? 'default' : 'outline'}
                      onClick={() => playPreview(v.id)}
                      className={selectedVoice === v.id ? 'bg-[#4FB8FF] text-white' : ''}
                    >
                      {selectedVoice === v.id ? <Check className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
                      {v.label}
                    </Button>
                  ))}
                </div>
                <audio ref={previewRef} className="hidden" preload="auto" />
                
                {/* Streaming TTS Section */}
                <div className="space-y-4">
                  <Button
                    onClick={startStreamingTTS}
                    disabled={!selectedVoice || isStreamingTTS}
                    className="w-full bg-[#4FB8FF] text-white"
                  >
                    {isStreamingTTS
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Streaming Audio…</>
                      : <><Mic className="mr-2 h-4 w-4" />Start Live Narration</>}
                  </Button>
                  
                  {isStreamingTTS && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Streaming progress: {Math.round(streamingProgress)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#4FB8FF] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${streamingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Fallback TTS */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Or use traditional generation:</p>
                  <Button
                    onClick={() => ttsMutation.mutate()}
                    disabled={!selectedVoice || ttsMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {ttsMutation.isPending
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
                      : <><Mic className="mr-2 h-4 w-4" />Generate Narration</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Share */}
          <TabsContent value="share">
            <Card>
              <CardHeader><CardTitle>Your Audiobook</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap justify-center gap-4">
                <Button onClick={togglePlay} className="w-full sm:w-auto bg-[#4FB8FF] text-white">
                  {isPlaying
                    ? <PauseCircle className="mr-1 h-5 w-5" />
                    : <PlayCircle  className="mr-1 h-5 w-5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  onClick={() => navigator.clipboard.writeText(audioUrl!)}
                  disabled={!audioUrl}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <CopyIcon className="mr-1 h-5 w-5" />Copy
                </Button>
                <Button
                  onClick={() => { const a = document.createElement('a'); a.href = audioUrl!; a.download = 'storytime.mp3'; a.click(); }}
                  disabled={!audioUrl}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <DownloadIcon className="mr-1 h-5 w-5" />Download
                </Button>
                <Button
                  onClick={() => window.open(audioUrl!, '_blank')}
                  disabled={!audioUrl}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <LinkIcon className="mr-1 h-5 w-5" />Open
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}