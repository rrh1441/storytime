// src/app/create-story/page.tsx
'use client'; // Required for hooks, state, form handling, client-side APIs

import React, { useEffect, useRef, useState, KeyboardEvent } from 'react'; // Import React
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link'; // Use Next.js Link
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // Use Next.js navigation hooks

// Import useAuth correctly - includes session information
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast'; // Correct the import path if necessary

// --- IMPORT YOUR SERVER ACTIONS ---
import { generateStoryAction, generateTtsAction } from '@/app/actions';

/* ─────────── UI components ─────────── */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react'; // Keep only used icons

/* ─────────── Icons ─────────── */
import {
  Sparkles,
  Edit,
  Headphones,
  Share2,
  PenTool,
  AlertCircle,
  Mic,
  PlayCircle,
  PauseCircle,
  Copy as CopyIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  Check,
  Play,
} from 'lucide-react';

/* ─────────── Static data ─────────── */
const THEME_SUGGESTIONS = [
  'Adventure',
  'Friendship',
  'Magic',
  'Space',
  'Animals',
  'Kindness',
] as const;

const LENGTH_OPTIONS = [3, 5, 10, 15, 30, 60] as const;

const SUPPORTED_VOICES = [
  { id: 'alloy', label: 'Alex (US)' },
  { id: 'echo', label: 'Ethan (US)' },
  { id: 'fable', label: 'Felix (UK)' },
  { id: 'nova', label: 'Nora (US)' },
  { id: 'onyx', label: 'Oscar (US)' },
  { id: 'shimmer', label: 'Selina (US)' },
] as const;

// Bucket name in Supabase Storage (ensure env var is set in .env.local and Vercel)
const PREVIEW_BUCKET_NAME = process.env.NEXT_PUBLIC_VOICE_PREVIEW_BUCKET || 'voice-previews'; // Use env var or default

const SUPPORTED_LANGUAGES = [
  'Afrikaans', 'Arabic', 'Armenian', 'Azerbaijani', 'Belarusian', 'Bosnian', 'Bulgarian', 'Catalan', 'Chinese', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Finnish', 'French', 'Galician', 'German', 'Greek', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Italian', 'Japanese', 'Kannada', 'Kazakh', 'Korean', 'Latvian', 'Lithuanian', 'Macedonian', 'Malay', 'Marathi', 'Maori', 'Nepali', 'Norwegian', 'Persian', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Serbian', 'Slovak', 'Slovenian', 'Spanish', 'Swahili', 'Swedish', 'Tagalog', 'Tamil', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese', 'Welsh',
] as const;

/* ─────────── Zod schema (Title Removed) ─────────── */
const storyFormSchema = z.object({
  theme: z.string().min(1, 'Theme is required.'),
  length: z.number().min(3).max(60),
  language: z.string().refine(
    (val) => (SUPPORTED_LANGUAGES as readonly string[]).includes(val),
    { message: 'Unsupported language' },
  ),
  mainCharacter: z.string().max(50).optional().nullable(),
  educationalFocus: z.string().optional().nullable(),
  additionalInstructions: z.string().max(500).optional().nullable(),
});

// Updated FormValues type
export type FormValues = z.infer<typeof storyFormSchema>;
export type ActiveTab = 'parameters' | 'edit' | 'voice' | 'share';

/* ─────────── Component ─────────── */
export default function StoryCreator() {
  // Destructure user, profile, session and loading state correctly
  const { user, profile, loading: authLoading } = useAuth(); // Get supabase client from context
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Determine initial tab (e.g., if redirected back from login)
  const initialTab = searchParams.get('tab') as ActiveTab | null;

  // Correct check for subscriber status using profile
  const isSubscriber = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';

  console.log(
    '[StoryCreator] Rendering - Auth Loading:', authLoading,
    '| User:', !!user,
    '| Profile Status:', profile?.subscription_status,
    '| Is Subscriber:', isSubscriber
  );

  /* ── state ──────────────────────────────────────────────── */
  const [storyContent, setStoryContent] = useState('');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab || 'parameters');
  const [storyTitle, setStoryTitle] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null); // State to hold the story ID

  /* ── scroll-to-top on tab switch ────────────────────────── */
  const pageTopRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({ behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  /* ── audio handling ────────────── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // For the main generated audio

  // --- Main Audio Play/Pause ---
  const handlePlayPause = () => {
    if (!generatedAudioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(generatedAudioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        toast({ title: 'Playback Error', description: 'Could not load main audio.', variant: 'destructive' });
        setIsPlaying(false);
      };
    } else {
      if (audioRef.current.src !== generatedAudioUrl) {
        audioRef.current.src = generatedAudioUrl;
      }
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause preview audio if it's playing
      previewAudioRef.current?.pause();

      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Error playing main audio:', err);
          toast({ title: 'Playback error', description: 'Unable to play audio.', variant: 'destructive' });
          setIsPlaying(false);
        });
    }
  };

  // Cleanup main audio element on unmount
  useEffect(() => {
    const currentAudioRef = audioRef.current;
    return () => {
      currentAudioRef?.pause();
      if (currentAudioRef) {
        currentAudioRef.onended = null;
        currentAudioRef.onerror = null;
        currentAudioRef.src = ''; // Release resource
      }
    };
  }, []);

  // --- Share Actions ---
  const handleCopyLink = () => {
    if (!generatedAudioUrl) return;
    navigator.clipboard.writeText(generatedAudioUrl).then(() =>
      toast({ title: 'Link copied', description: 'URL copied to clipboard.', variant: 'success' })
    );
  };

  const handleDownload = () => {
    if (!generatedAudioUrl) return;
    const title = storyTitle || 'storytime';
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const a = document.createElement('a');
    a.href = generatedAudioUrl;
    a.download = `${safeTitle}.mp3`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpen = () => {
    if (!generatedAudioUrl) return;
    window.open(generatedAudioUrl, '_blank', 'noopener,noreferrer');
  };

  // --- Voice Preview Handling ---
  const handleVoicePreview = (voiceId: string) => {
    setSelectedVoiceId(voiceId); // Set the selected voice for generation

    // Pause main audio if it's playing
    audioRef.current?.pause();
    setIsPlaying(false);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set.');
      toast({ title: 'Config Error', description: 'Cannot load voice previews.', variant: 'destructive' });
      return;
    }
    const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
    const previewUrl = `${baseUrl}/storage/v1/object/public/${PREVIEW_BUCKET_NAME}/${voiceId}.mp3`;
    console.log(`[Preview] Attempting to play: ${previewUrl}`);

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
      previewAudioRef.current.preload = 'auto';
      previewAudioRef.current.onerror = (event: Event | string) => {
        if (typeof event === 'string') {
            console.error(`Preview audio element error loading ${previewUrl}:`, event);
        } else {
            console.error(`Preview audio element error loading ${previewUrl}:`, event);
            const target = event.currentTarget as HTMLAudioElement; // Correct type assertion
            const errorDetails = target.error ? ` Code ${target.error.code}: ${target.error.message}` : '';
            toast({
                title: 'Preview Error',
                description: `Could not load preview audio. Ensure '${voiceId}.mp3' exists in the '${PREVIEW_BUCKET_NAME}' bucket and is public.${errorDetails}`,
                variant: 'destructive',
            });
        }
      };
    }

    previewAudioRef.current.pause(); // Pause previous preview if any
    previewAudioRef.current.currentTime = 0;
    previewAudioRef.current.src = previewUrl;

    previewAudioRef.current.play().catch(err => {
      console.error(`Error playing preview ${previewUrl}:`, err);
      toast({ title: 'Preview Playback Error', description: 'Could not play the audio preview file.', variant: 'destructive' });
    });
  };

  // Cleanup preview audio on unmount
  useEffect(() => {
    const currentPreviewRef = previewAudioRef.current;
    return () => {
      currentPreviewRef?.pause();
      if (currentPreviewRef) {
        currentPreviewRef.onerror = null;
        currentPreviewRef.src = ''; // Release resource
      }
    };
  }, []);

  /* ── form ──────────────────────────────── */
  const form = useForm<FormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      theme: '',
      length: 3,
      language: 'English',
      mainCharacter: null,
      educationalFocus: null,
      additionalInstructions: null,
    },
    mode: 'onBlur', // Validate on blur
  });

  /* ── Mutations (Using Server Actions) ────────────────────── */

  // --- Generate Story Mutation ---
  const generateStory = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log('[Mutation] Calling generateStoryAction with:', data);
      // Server Action handles auth check internally
      const result = await generateStoryAction(data);
      console.log('[Mutation] generateStoryAction result:', result);

      if (result.error) {
        throw new Error(result.error); // Propagate error to onError handler
      }
      if (!result.story || !result.title || !result.storyId) {
        throw new Error('Incomplete story data received from action.');
      }
      return result as { story: string; title: string; storyId: string };
    },
    onSuccess: ({ story, title, storyId: newStoryId }) => {
      setStoryContent(story);
      setStoryTitle(title);
      setStoryId(newStoryId); // Store the returned story ID
      setGeneratedAudioUrl(null); // Reset audio URL when new story is generated
      setIsPlaying(false); // Reset play state
      setActiveTab('edit');
      toast({ title: 'Story Generated!', description: 'Review and edit your new tale.', variant: 'success' });
    },
    onError: (e: Error) => {
      console.error('[Mutation Error] generateStory:', e);
      if (e.message.includes('User not authenticated')) {
        toast({
          title: 'Login Required',
          description: 'Please log in or sign up to generate stories.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Story Generation Failed',
          description: e.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    },
  });

  // --- Generate Audio Mutation ---
  const generateAudio = useMutation({
    mutationFn: async (params: { text: string; voiceId: string; storyId: string | null }) => {
      if (!params.storyId) {
        throw new Error('Story ID is missing. Cannot generate audio.');
      }
      const language = form.getValues('language'); // Get language from form state

      console.log('[Mutation] Calling generateTtsAction with:', { ...params, language });
      // Server Action handles auth check internally
      const result = await generateTtsAction({
        text: params.text,
        voiceId: params.voiceId,
        storyId: params.storyId,
        language: language, // Pass language
      });
      console.log('[Mutation] generateTtsAction result:', result);

      if (result.error) {
        throw new Error(result.error);
      }
      if (!result.audioUrl) {
        throw new Error('Audio URL not received from action.');
      }
      return result.audioUrl; // Return only the URL
    },
    onSuccess: (url) => {
      setGeneratedAudioUrl(url);
      setActiveTab('share');
      previewAudioRef.current?.pause(); // Pause preview if playing
      toast({ title: 'Narration Ready!', description: 'Your story audio has been generated.', variant: 'success' });
    },
    onError: (e: Error) => {
      console.error('[Mutation Error] generateAudio:', e);
      if (e.message.includes('User not authenticated')) {
        toast({ title: 'Login Required', description: 'Please log in to generate audio.', variant: 'destructive' });
      } else {
        toast({
          title: 'Audio Generation Failed',
          description: e.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    }
  });

  /* ── Event Handlers ───────────────────────────────────── */

  // Handles theme suggestion button clicks
  const handleThemeClick = (suggestion: string) => {
      form.setValue("theme", suggestion, { shouldValidate: true, shouldDirty: true });
  };

  // Handles theme input keydown for suggestions (optional enhancement)
  const handleThemeKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key !== 'Enter' || !e.currentTarget.value) return;
    const match = THEME_SUGGESTIONS.find((t) =>
      t.toLowerCase().startsWith(e.currentTarget.value.toLowerCase()),
    );
    if (match) {
        form.setValue('theme', match, { shouldValidate: true, shouldDirty: true });
        e.preventDefault(); // Prevent form submission if inside a form
    }
  };

  // Handler for the "Generate Story" button click
  const handleGenerateStorySubmit = (data: FormValues) => {
    console.log("Form data submitted for story generation:", data);
    // Reset previous results before generating new story
    setStoryContent('');
    setStoryTitle(null);
    setStoryId(null);
    setGeneratedAudioUrl(null);
    setIsPlaying(false);
    audioRef.current?.pause();
    previewAudioRef.current?.pause();
    // Trigger the mutation
    generateStory.mutate(data);
  };

  // Handler for the "Generate Narration" button click
  const handleGenerateNarrationClick = () => {
    const currentStoryContent = storyContent; // Use state value
    const currentVoiceId = selectedVoiceId;
    const currentStoryId = storyId;

    if (currentStoryContent && currentVoiceId && currentStoryId) {
      // Reset previous audio state before generating new one
      setGeneratedAudioUrl(null);
      setIsPlaying(false);
      audioRef.current?.pause();
      // Trigger the mutation
      generateAudio.mutate({ text: currentStoryContent, voiceId: currentVoiceId, storyId: currentStoryId });
    } else if (!currentStoryId) {
      toast({ title: "Error", description: "Story ID missing. Please generate a story first.", variant: "destructive" });
    } else if (!currentVoiceId) {
      toast({ title: "Error", description: "Please select a voice first.", variant: "destructive" });
    } else {
      toast({ title: "Error", description: "Missing required information to generate narration.", variant: "destructive" });
    }
  };

  /* ── Watched values for UI updates ────────────────────── */
  const additionalChars = (form.watch('additionalInstructions') || '').length;
  const watchLanguage = form.watch('language'); // Watch language for display

  /* ── Render Logic ─────────────────────────────────────── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="ml-4 text-muted-foreground">Loading authentication...</p>
      </div>
    );
  }

  return (
    <div ref={pageTopRef} className="min-h-screen bg-[#F9FAFC] py-12">
      <div className="container mx-auto px-6">
        <h1 className="mb-4 text-3xl font-display font-bold text-gray-700">
          Story Creator Studio
        </h1>
        {storyTitle && activeTab !== 'parameters' && (
          <h2 className="text-2xl font-semibold text-[#8A4FFF] mb-6">
            Story: <span className="italic">{storyTitle}</span>
          </h2>
        )}

        <Form {...form}>
          {/* Prevent default form submission; rely on button clicks */}
          <form onSubmit={(e) => e.preventDefault()}>
            <Tabs
              value={activeTab}
              onValueChange={(v: string) => setActiveTab(v as ActiveTab)}
              className="space-y-6"
            >
              <TabsList className="flex flex-wrap h-auto justify-start gap-x-2 gap-y-1 sm:justify-center">
                <TabsTrigger value="parameters"><PenTool className="mr-1 h-4 w-4 flex-shrink-0" /> Story Outline</TabsTrigger>
                <TabsTrigger value="edit" disabled={!storyContent}><Edit className="mr-1 h-4 w-4 flex-shrink-0" /> Edit / Preview</TabsTrigger>
                <TabsTrigger value="voice" disabled={!storyContent}><Headphones className="mr-1 h-4 w-4 flex-shrink-0" /> Voice & Audio</TabsTrigger>
                <TabsTrigger value="share" disabled={!generatedAudioUrl}><Share2 className="mr-1 h-4 w-4 flex-shrink-0" /> Share Story</TabsTrigger>
              </TabsList>

              {/* ───────────────────────────── Parameters Tab ───────────────────────────── */}
              <TabsContent value="parameters">
                <Card>
                  <CardHeader>
                    <CardTitle>Story Outline</CardTitle>
                    <CardDescription>
                      Describe the story you want the AI to create. The title will be generated automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* THEME */}
                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme / Genre <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Adventure, Friendship, Magic"
                              onKeyDown={handleThemeKey} // Optional: Handle Enter key for suggestions
                            />
                          </FormControl>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {THEME_SUGGESTIONS.map((suggestion) => (
                              <Button
                                key={suggestion} type="button" variant="outline" size="sm"
                                onClick={() => handleThemeClick(suggestion)} // Use dedicated handler
                                className={`text-xs ${form.watch("theme") === suggestion ? 'bg-accent text-accent-foreground' : ''}`}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                          <FormMessage /> {/* Displays validation errors */}
                        </FormItem>
                      )}
                    />

                    {/* LENGTH */}
                    <FormField
                      control={form.control} name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approximate Length (minutes) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                             <RadioGroup
                                className="flex flex-wrap gap-3" value={String(field.value)}
                                onValueChange={(v: string) => field.onChange(Number(v))} // Explicitly type 'v'
                             >
                               {LENGTH_OPTIONS.map((len) => {
                                 const disabled = !isSubscriber && len !== 3; // Disable options for non-subscribers except 3 min
                                 return (
                                   <div key={len} className="flex items-center space-x-2">
                                     <RadioGroupItem value={String(len)} id={`len-${len}`} disabled={disabled} />
                                     <Label htmlFor={`len-${len}`} className={disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>
                                       {len} min
                                     </Label>
                                   </div>
                                 );
                               })}
                             </RadioGroup>
                          </FormControl>
                           {/* Upsell/Login Prompt */}
                           {!user ? (
                             <p className="mt-1 text-xs text-muted-foreground">
                               <Link href={`/login?redirect=${pathname}&tab=parameters`} className="text-primary underline">Log in</Link> or <Link href={`/signup?redirect=${pathname}&tab=parameters`} className="text-primary underline">sign up</Link> to create longer stories.
                             </p>
                           ) : !isSubscriber ? (
                             <p className="mt-1 text-xs text-muted-foreground">
                               Want longer tales? <Link href="/pricing" className="text-primary underline">Upgrade your plan!</Link>
                             </p>
                           ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* LANGUAGE */}
                    <FormField
                      control={form.control} name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            {/* Using Input with datalist for suggestions */}
                            <Input {...field} list="lang-suggestions" placeholder="English, Spanish, French…" />
                          </FormControl>
                          <datalist id="lang-suggestions">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                              <option key={lang} value={lang} />
                            ))}
                          </datalist>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* MAIN CHARACTER */}
                    <FormField
                      control={form.control} name="mainCharacter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Character (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g., Penelope, Hudson, Luna the Rabbit" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* EDUCATIONAL FOCUS */}
                    <FormField
                      control={form.control} name="educationalFocus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Educational Focus (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g., Counting to 10, The Water Cycle, Being Kind" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SPECIAL REQUESTS */}
                    <FormField
                      control={form.control} name="additionalInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requests (Optional)</FormLabel>
                          <FormControl><Textarea rows={4} {...field} value={field.value ?? ''} placeholder="e.g., Make the ending happy, include a talking squirrel, avoid scary themes" /></FormControl>
                          <p className="text-right text-sm text-muted-foreground">{additionalChars}/500</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="button" // Use type="button" to prevent default form submission
                      className="w-full bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90"
                      disabled={generateStory.isPending || !form.formState.isValid || authLoading} // Disable if loading auth, pending, or form invalid
                      onClick={form.handleSubmit(handleGenerateStorySubmit)} // Use RHF's handleSubmit to validate before calling mutation
                    >
                      {generateStory.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…(~10s)</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Generate Story</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* ───────────────────────────── Edit / Preview Tab ───────────────────────────── */}
              <TabsContent value="edit">
                <Card>
                  <CardHeader>
                    <CardTitle>Edit & Preview Story</CardTitle>
                    <CardDescription>
                      Review and edit the generated story text below. The title "<span className="italic font-medium">{storyTitle || 'Generated Story'}</span>" was created by the AI.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {/* Editor Textarea */}
                    <div>
                      <Label htmlFor="story-editor" className="mb-1 block">Edit Text</Label>
                      <Textarea
                        id="story-editor" value={storyContent}
                        onChange={(e) => setStoryContent(e.target.value)} // Update state directly on change
                        rows={20} className="resize-y min-h-[300px]" // Allow vertical resize
                      />
                    </div>
                    {/* Live Preview */}
                    <div>
                      <Label className="mb-1 block">Preview</Label>
                      {/* Use prose for basic Markdown styling, adjust max-height and overflow */}
                      <article className="prose prose-sm max-w-none h-[calc(20rem_+_112px)] overflow-y-auto rounded-md border bg-background p-4">
                        {/* Split by newline, filter empty paragraphs, remove leading # */}
                        {storyContent.split("\n").filter(p => p.trim() !== '').map((p, i) => <p key={i}>{p.replace(/^#\s+/, "")}</p>)}
                      </article>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {/* Button to proceed to the next step */}
                    <Button
                      type="button" className="ml-auto bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90"
                      onClick={() => setActiveTab("voice")} disabled={!storyContent.trim()}
                    >
                      Continue to Voice & Audio
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* ───────────────────────────── Voice & Audio Tab ───────────────────────────── */}
              <TabsContent value="voice">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Narration</CardTitle>
                    <CardDescription>
                      Select a voice below to preview it and set it for narration. (Language: {watchLanguage})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Voice Selection Buttons */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {SUPPORTED_VOICES.map((v) => (
                          <Button
                            key={v.id} variant={selectedVoiceId === v.id ? 'default' : 'outline'} size="sm"
                            onClick={() => handleVoicePreview(v.id)} // Trigger preview and set selected ID
                            // Dynamic styling based on selection
                            className={`flex min-w-[100px] items-center justify-start gap-1.5 rounded-md px-3 py-2 text-left transition-all sm:min-w-[120px] ${selectedVoiceId === v.id ? 'bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90 ring-2 ring-offset-2 ring-[#4FB8FF]' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            {selectedVoiceId === v.id ? (<Check className="h-4 w-4 flex-shrink-0" />) : (<Play className="h-4 w-4 flex-shrink-0 text-muted-foreground" />)}
                            <span className="truncate">{v.label}</span>
                          </Button>
                        ))}
                      </div>
                      {/* Hidden audio element for previews */}
                      <audio ref={previewAudioRef} className="hidden" preload="auto" />
                    </div>

                    {/* Generate Narration Button */}
                    <Button
                      type="button" // Important: type="button"
                      className="w-full bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90"
                      onClick={handleGenerateNarrationClick} // Call the specific handler
                      // Disable if pending, no voice selected, no content, no storyId, or language invalid
                      disabled={generateAudio.isPending || !selectedVoiceId || !storyContent.trim() || !storyId || !(SUPPORTED_LANGUAGES as readonly string[]).includes(form.getValues("language"))}
                    >
                      {generateAudio.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…(~60s)</>
                      ) : (
                        <><Mic className="mr-2 h-4 w-4" /> Generate Narration</>
                      )}
                    </Button>

                    {/* Display error if audio generation failed */}
                    {generateAudio.isError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Generating Audio</AlertTitle>
                        <AlertDescription>{generateAudio.error instanceof Error ? generateAudio.error.message : "An unknown error occurred."}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ───────────────────────────── Share Tab ───────────────────────────── */}
              <TabsContent value="share">
                <Card>
                  <CardHeader>
                    <CardTitle>Share Your Story: <span className="italic">{storyTitle || 'Generated Story'}</span></CardTitle>
                    <CardDescription>Listen, copy link, download, or open your narrated story.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap justify-center gap-4">
                      {/* Play / Pause Button */}
                      <Button
                        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                        className="flex items-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition-colors w-full sm:w-auto bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90"
                        onClick={handlePlayPause} disabled={!generatedAudioUrl || generateAudio.isPending} // Disable if no URL or TTS is pending
                      >
                        {isPlaying ? (<PauseCircle className="h-6 w-6" />) : (<PlayCircle className="h-6 w-6" />)}
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>

                      {/* Copy Link Button */}
                      <Button
                        aria-label="Copy link"
                        className="flex items-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition-colors w-full sm:w-auto border-2 border-[#4FB8FF] bg-white text-[#4FB8FF] hover:bg-[#4FB8FF] hover:text-white"
                        onClick={handleCopyLink} disabled={!generatedAudioUrl || generateAudio.isPending}
                      >
                        <CopyIcon className="h-6 w-6" /> Copy
                      </Button>

                      {/* Download Button */}
                      <Button
                        aria-label="Download MP3"
                        className="flex items-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition-colors w-full sm:w-auto border-2 border-[#4FB8FF] bg-white text-[#4FB8FF] hover:bg-[#4FB8FF] hover:text-white"
                        onClick={handleDownload} disabled={!generatedAudioUrl || generateAudio.isPending}
                      >
                        <DownloadIcon className="h-6 w-6" /> Download
                      </Button>

                      {/* Open in New Tab Button */}
                      <Button
                        aria-label="Open in new tab"
                        className="flex items-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition-colors w-full sm:w-auto border-2 border-[#4FB8FF] bg-white text-[#4FB8FF] hover:bg-[#4FB8FF] hover:text-white"
                        onClick={handleOpen} disabled={!generatedAudioUrl || generateAudio.isPending}
                      >
                        <LinkIcon className="h-6 w-6" /> Open
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {/* Conditional text based on audio state */}
                    {!generatedAudioUrl && !generateAudio.isPending && (<p className="w-full text-center text-sm text-muted-foreground">Generate narration first to enable sharing actions.</p>)}
                    {generateAudio.isPending && (<p className="w-full text-center text-sm text-muted-foreground">Generating audio... sharing actions will be enabled shortly.</p>)}
                  </CardFooter>
                </Card>
              </TabsContent>

            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}
