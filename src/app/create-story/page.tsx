// src/app/create-story/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompletion } from '@ai-sdk/react'; // Vercel AI SDK
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardFooter, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Check, Play, Mic, PlayCircle, PauseCircle, Copy as CopyIcon, Download as DownloadIcon, Link as LinkIcon, Headphones, Share2, PenTool, Edit } from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { generateTtsAction } from '@/app/actions';

/*───────────────────────────── schema ─────────────────────────────*/
const formSchema = z.object({
  hero         : z.string().min(1, 'Hero is required.'),
  theme        : z.string().min(1, 'Theme is required.'),
  extraDetails : z.string().max(500).optional().nullable(),
  length       : z.number().min(1).max(60),
});

type FormValues = z.infer<typeof formSchema>;
type Step = 'outline' | 'edit' | 'voice' | 'share';

/*───────────────────────────── constants ──────────────────────────*/
const LENGTH_OPTIONS = [3, 5, 10, 15] as const;
const SUPPORTED_VOICES = [
  { id: 'alloy',  label: 'Alex (US)' },
  { id: 'fable',  label: 'Felix (UK)' },
  { id: 'nova',   label: 'Nora (US)' },
] as const;
const PREVIEW_BUCKET = process.env.NEXT_PUBLIC_VOICE_PREVIEW_BUCKET ?? 'voice-previews';

/*───────────────────────────── component ──────────────────────────*/
export default function CreateStoryPage() {
  /* form */
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { hero: '', theme: '', extraDetails: null, length: 3 },
  });

  /* story generation (Vercel AI SDK) */
  const { completion, complete, isLoading: isGenerating, error: genError } = useCompletion({
    api           : '/api/completion',
    streamProtocol: 'text',               // text stream for useCompletion [oai_citation:0‡AI SDK](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-completion?utm_source=chatgpt.com),
  });

  /* local state */
  const [step,            setStep]            = useState<Step>('outline');
  const [storyText,       setStoryText]       = useState('');
  const [storyTitle,      setStoryTitle]      = useState<string | null>(null);
  const [selectedVoice,   setSelectedVoice]   = useState<string>();
  const [audioUrl,        setAudioUrl]        = useState<string | null>(null);
  const [isPlaying,       setIsPlaying]       = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  /* sync streamed text to editor */
  useEffect(() => { setStoryText(completion); }, [completion]);

  /* prompt builder */
  function buildPrompt(values: FormValues): string {
    const extra = values.extraDetails ? ` Additional details: ${values.extraDetails}.` : '';
    return `Write a children's story (~${values.length} minutes to read) with a positive tone.\nHero: ${values.hero}\nTheme: ${values.theme}.${extra}\nReturn ONLY the story text without title.`;
  }

  /* generate story */
  async function handleGenerate(values: FormValues) {
    setStoryTitle(null);
    setAudioUrl(null);
    setSelectedVoice(undefined);
    await complete(buildPrompt(values));
    if (genError) toast({ title: 'Generation failed', description: genError.message, variant: 'destructive' });
    else setStep('edit');
  }

  /*──────────────────────── TTS mutation ────────────────────────*/
  const ttsMutation = useMutation({
    mutationFn : async (p: { text: string; voiceId: string }) => {
      const res = await generateTtsAction({ text: p.text, voiceId: p.voiceId });
      if (res.error || !res.audioUrl) throw new Error(res.error ?? 'TTS failed');
      return res.audioUrl;
    },
    onSuccess  : (url) => {
      setAudioUrl(url);
      setStep('share');
      toast({ title: 'Narration ready' });
    },
    onError    : (e: Error) => toast({ title: 'TTS error', description: e.message, variant: 'destructive' }),
  });

  /*──────────────────────── playback helpers ───────────────────*/
  function toggleMainPlayback() {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else           { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => toast({ title: 'Playback error', variant: 'destructive' })); }
  }

  function playPreview(id: string) {
    setSelectedVoice(id);
    audioRef.current?.pause(); setIsPlaying(false);
    const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    if (!supabaseURL) return toast({ title: 'Config error', description: 'Supabase URL missing', variant: 'destructive' });
    const url = `${supabaseURL}/storage/v1/object/public/${PREVIEW_BUCKET}/${id}.mp3`;
    if (!previewRef.current) previewRef.current = new Audio();
    previewRef.current.src = url;
    previewRef.current.play().catch(() => toast({ title: 'Preview error', variant: 'destructive' }));
  }

  /*──────────────────────── render ─────────────────────────────*/
  return (
    <div className="min-h-screen bg-[#F9FAFC] py-10">
      <div className="container mx-auto px-4">
        <h1 className="mb-6 text-3xl font-bold text-gray-700">Storytime Creator</h1>

        <Tabs value={step} onValueChange={(v) => setStep(v as Step)}>
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="outline"><PenTool className="mr-1 h-4 w-4" />Outline</TabsTrigger>
            <TabsTrigger value="edit"   disabled={!storyText}><Edit className="mr-1 h-4 w-4" />Edit</TabsTrigger>
            <TabsTrigger value="voice"  disabled={!storyText}><Headphones className="mr-1 h-4 w-4" />Voice</TabsTrigger>
            <TabsTrigger value="share"  disabled={!audioUrl}><Share2 className="mr-1 h-4 w-4" />Share</TabsTrigger>
          </TabsList>

          {/*──────────── Outline ────────────*/}
          <TabsContent value="outline">
            <Card>
              <CardHeader><CardTitle>Story Outline</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
                  {/* Hero */}
                  <div>
                    <Label>Hero <span className="text-red-500">*</span></Label>
                    <Input {...form.register('hero')} placeholder="e.g. Luna the Rabbit" />
                  </div>
                  {/* Theme */}
                  <div>
                    <Label>Theme <span className="text-red-500">*</span></Label>
                    <Input {...form.register('theme')} placeholder="e.g. Friendship" />
                  </div>
                  {/* Extra */}
                  <div>
                    <Label>Extra details</Label>
                    <Textarea rows={4} {...form.register('extraDetails')} placeholder="Any special requests…" />
                  </div>
                  {/* Length */}
                  <div>
                    <Label>Length (minutes)</Label>
                    <RadioGroup
                      value={String(form.watch('length'))}
                      onValueChange={(v) => form.setValue('length', Number(v))}
                      className="flex gap-4"
                    >
                      {LENGTH_OPTIONS.map((n) => (
                        <div key={n} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(n)} id={`len-${n}`} />
                          <Label htmlFor={`len-${n}`}>{n}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Button type="submit" disabled={!form.formState.isValid || isGenerating} className="w-full bg-[#4FB8FF] text-white">
                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : 'Generate Story'}
                  </Button>
                </form>
                {genError && <p className="text-sm text-red-600">{genError.message}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/*──────────── Edit ────────────*/}
          <TabsContent value="edit">
            <Card>
              <CardHeader><CardTitle>Edit Story</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Textarea
                  rows={20}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  className="resize-y min-h-[300px]"
                />
                <article className="prose prose-sm max-w-none h-[calc(20rem_+_112px)] overflow-y-auto rounded-md border bg-background p-4">
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

          {/*──────────── Voice ────────────*/}
          <TabsContent value="voice">
            <Card>
              <CardHeader><CardTitle>Select Voice</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {SUPPORTED_VOICES.map((v) => (
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
                <Button
                  onClick={() => ttsMutation.mutate({ text: storyText, voiceId: selectedVoice! })}
                  disabled={!selectedVoice || ttsMutation.isPending}
                  className="w-full bg-[#4FB8FF] text-white"
                >
                  {ttsMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Mic className="mr-2 h-4 w-4" />Generate Narration</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/*──────────── Share ────────────*/}
          <TabsContent value="share">
            <Card>
              <CardHeader><CardTitle>Your Audiobook</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap justify-center gap-4">
                <Button onClick={toggleMainPlayback} className="w-full sm:w-auto bg-[#4FB8FF] text-white">
                  {isPlaying ? <PauseCircle className="mr-1 h-5 w-5" /> : <PlayCircle className="mr-1 h-5 w-5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  onClick={() => navigator.clipboard.writeText(audioUrl!)}
                  disabled={!audioUrl}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <CopyIcon className="mr-1 h-5 w-5" />Copy Link
                </Button>
                <Button
                  onClick={() => { const a=document.createElement('a'); a.href=audioUrl!; a.download='storytime.mp3'; a.click(); }}
                  disabled={!audioUrl}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <DownloadIcon className="mr-1 h-5 w-5" />Download
                </Button>
                <Button onClick={() => window.open(audioUrl!, '_blank')} disabled={!audioUrl} variant="outline" className="w-full sm:w-auto">
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