// src/app/create-story/page.tsx
'use client'; // Required for hooks, state, form handling, client-side APIs

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Assuming QueryClientProvider is in layout
import Link from 'next/link'; // Use Next.js Link
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // Use Next.js navigation hooks

// Import useAuth correctly - includes session information
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast'; // Assuming this uses Shadcn toast or Sonner configured globally
// TODO: Define or remove API_BASE if API calls are handled by Next.js API routes/Server Actions
// import { API_BASE } from "@/lib/apiBase";
// TODO: Define or remove these API helpers
// import { getStory, patchStory } from "@/lib/storyApi";

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

// Bucket name in Supabase Storage (ensure env var is set)
const PREVIEW_BUCKET_NAME = 'voice-previews';

const SUPPORTED_LANGUAGES = [
 'Afrikaans', 'Arabic', 'Armenian', 'Azerbaijani', 'Belarusian', 'Bosnian', 'Bulgarian', 'Catalan', 'Chinese', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Finnish', 'French', 'Galician', 'German', 'Greek', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Italian', 'Japanese', 'Kannada', 'Kazakh', 'Korean', 'Latvian', 'Lithuanian', 'Macedonian', 'Malay', 'Marathi', 'Maori', 'Nepali', 'Norwegian', 'Persian', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Serbian', 'Slovak', 'Slovenian', 'Spanish', 'Swahili', 'Swedish', 'Tagalog', 'Tamil', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese', 'Welsh',
] as const;

/* ─────────── Zod schema (Title Removed) ─────────── */
const schema = z.object({
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
export type FormValues = z.infer<typeof schema>;
export type ActiveTab = 'parameters' | 'edit' | 'voice' | 'share';

/* ─────────── Component ─────────── */
// Removed React.FC type for simpler default export
export default function StoryCreator() {
 // Destructure user, profile, session and loading state correctly
 const { user, profile, loading: authLoading, session, supabase } = useAuth(); // Get supabase client from context
 const router = useRouter(); // Use Next.js router
 // Use searchParams to potentially read redirect info if needed
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
 const [storyId, setStoryId] = useState<string | null>(null);

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
 const [isPlaying, setIsPlaying] = useState(false);

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
   // Ensure src is updated if it changed
   if (audioRef.current.src !== generatedAudioUrl) {
    audioRef.current.src = generatedAudioUrl;
   }
  }

  if (isPlaying) {
   audioRef.current.pause();
   setIsPlaying(false);
  } else {
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
 // Cleanup audio element on unmount
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

 const handleCopyLink = () => {
  if (!generatedAudioUrl) return;
  navigator.clipboard.writeText(generatedAudioUrl).then(() =>
   toast({ title: 'Link copied', description: 'URL copied to clipboard.' }),
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
  document.body.removeChild(a); // Use removeChild for broader browser support
 };

 const handleOpen = () => {
  if (!generatedAudioUrl) return;
  window.open(generatedAudioUrl, '_blank', 'noopener,noreferrer');
 };

 /* ── Voice Preview Handling ────────── */
 const handleVoicePreview = (voiceId: string) => {
  setSelectedVoiceId(voiceId);
  // Don't clear generated URL when just previewing

  // Use Next.js public env var
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
   console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set.');
   toast({
    title: 'Configuration Error',
    description: 'Supabase URL is not configured.',
    variant: 'destructive',
   });
   return;
  }
  const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
  const previewUrl = `${baseUrl}/storage/v1/object/public/${PREVIEW_BUCKET_NAME}/${voiceId}.mp3`;


  if (!previewAudioRef.current) {
   previewAudioRef.current = new Audio();
   previewAudioRef.current.preload = 'auto';
   previewAudioRef.current.onerror = (e) => {
    console.error(`Preview audio element error loading ${previewUrl}:`, e);
    const target = e.target as HTMLAudioElement;
    const errorDetails = target.error ? ` Code ${target.error.code}: ${target.error.message}` : '';
    toast({
     title: 'Preview Error',
     description: `Could not load audio file. Check Supabase Storage permissions/file existence.${errorDetails}`,
     variant: 'destructive',
    });
   };
  }

  previewAudioRef.current.pause();
  previewAudioRef.current.currentTime = 0;
  previewAudioRef.current.src = previewUrl;

  previewAudioRef.current.play().catch(err => {
   console.error(`Error playing preview ${previewUrl}:`, err);
   toast({
    title: 'Preview Playback Error',
    description: 'Could not play the audio preview file.',
    variant: 'destructive',
   });
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
  resolver: zodResolver(schema),
  defaultValues: {
   theme: '',
   length: 3,
   language: 'English',
   mainCharacter: null,
   educationalFocus: null,
   additionalInstructions: null,
  },
  mode: 'onBlur',
 });

 /* ── mutations ──────────────────────────────────────────── */
 // TODO: Replace fetch calls with Next.js API Route or Server Action calls
 const generateStory = useMutation({
  mutationFn: async (data: FormValues) => {
   // Check if user is logged in before proceeding
   if (!user) {
    toast({
     title: 'Login Required',
     description: 'Please log in or sign up to generate stories.',
     variant: 'destructive',
     action: (
      // Navigate to login using Next.js router, passing redirect info via query params
      <Button variant="outline" size="sm" onClick={() => router.push(`/login?redirect=${pathname}&tab=parameters`)}>
       Log In
      </Button>
     ),
     duration: 5000,
    });
    throw new Error('User is not authenticated.');
   }

   const token = session?.access_token;
   if (!token) {
      console.warn("No auth token found for generateStory.");
      // Optionally handle this case - maybe re-authenticate or show error
   }

   // *** Replace with Next.js API route call or Server Action ***
   // Example using fetch to a hypothetical API route:
   const response = await fetch('/api/generate-story', { // Using Next.js API route
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
   });

   if (!response.ok) {
    let errorJson: { error?: string } = {};
    try { errorJson = await response.json(); } catch (parseError) { /* ignore */ }
    const errorMessage = errorJson?.error || `Request failed with status ${response.status}`;
    console.error('generateStory mutation failed:', errorMessage, '| Status:', response.status);

    if (response.status === 401) {
     toast({
      title: 'Authentication Error',
      description: errorMessage || 'Your session might be invalid. Please try logging in again.',
      variant: 'destructive',
      action: (
       <Button variant="outline" size="sm" onClick={() => router.push(`/login?redirect=${pathname}`)}>
        Log In
       </Button>
      ),
      duration: 5000,
     });
    }
    throw new Error(errorMessage);
   }

   return (await response.json()) as { story: string; title: string; storyId: string };
  },
  onSuccess: ({ story, title, storyId: newStoryId }) => {
   setStoryContent(story);
   setStoryTitle(title);
   setStoryId(newStoryId);
   setActiveTab('edit');
   toast({ title: 'Story Generated!', description: 'Review and edit your new tale.' });
  },
  onError: (e: Error) => {
   if (e.message !== 'User is not authenticated.' && !e.message.includes('session might be invalid')) {
    toast({
     title: 'Story Generation Failed',
     description: e.message || 'An unknown error occurred.',
     variant: 'destructive',
    });
   }
  },
 });

 const generateAudio = useMutation({
  mutationFn: async ({ text, voiceId, storyId }: { text: string; voiceId: string; storyId: string | null }) => {
   if (!user) {
    toast({ title: 'Login Required', description: 'Please log in to generate audio.', variant: 'destructive' });
    throw new Error('User not authenticated for TTS.');
   }
   if (!storyId) { throw new Error('Story ID is missing. Please generate a story first.'); }

   const language = form.getValues('language');
   const token = session?.access_token;

   // *** Replace with Next.js API route call or Server Action ***
   // Example using fetch to a hypothetical API route:
   const r = await fetch('/api/generate-tts', { // Using Next.js API route
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ text, voice: voiceId, language, storyId }),
   });

   if (!r.ok) {
    let errorJson: { error?: string } = {};
    try { errorJson = await r.json(); } catch (e) { /* ignore */ }
    const errorText = errorJson.error || await r.text() || `Audio generation failed with status ${r.status}`;
    console.error('generateAudio mutation failed:', errorText, '| Status:', r.status);
    if (r.status === 401) {
     toast({ title: 'Authentication Error', description: 'Session invalid for audio generation. Please log in.', variant: 'destructive' });
    }
    throw new Error(errorText);
   }
   // Assuming API route returns { audioUrl: string }
   return (await r.json()).audioUrl as string;
  },
  onSuccess: (url) => {
   setGeneratedAudioUrl(url);
   setActiveTab('share');
   if (previewAudioRef.current) {
    previewAudioRef.current.pause();
    previewAudioRef.current.currentTime = 0;
   }
   toast({ title: 'Narration Ready!', description: 'Your story audio has been generated.' });
  },
  onError: (e: Error) => {
   if (e.message !== 'User not authenticated for TTS.' && !e.message.includes('Session invalid')) {
    toast({
     title: 'Audio Generation Failed',
     description: e.message || 'An unknown error occurred.',
     variant: 'destructive',
    });
   }
  }
 });


 /* ── helpers ───────────────────────────────────────────── */
 const handleThemeKey = (e: KeyboardEvent<HTMLInputElement>): void => {
  if (e.key !== 'Enter') return;
  const match = THEME_SUGGESTIONS.find((t) =>
   t.toLowerCase().startsWith(e.currentTarget.value.toLowerCase()),
  );
  if (match) form.setValue('theme', match);
 };

 const additionalChars = (form.watch('additionalInstructions') || '').length;
 const watchLanguage = form.watch('language');

 // --- Render Logic ---
 if (authLoading) {
  return (
   <div className="min-h-screen bg-gray-100 py-12 flex items-center justify-center">
    <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
    <p className="ml-4 text-muted-foreground">Loading authentication...</p>
   </div>
  );
 }

 /* ── UI ─────────────────────────────────────────────────── */
 return (
  <div ref={pageTopRef} className="min-h-screen bg-[#F9FAFC] py-12"> {/* Use theme color */}
   <div className="container mx-auto px-6">
    <h1 className="mb-4 text-3xl font-display font-bold text-gray-700">
     Story Creator Studio
    </h1>
    {storyTitle && activeTab !== 'parameters' && (
     <h2 className="text-2xl font-semibold text-[#8A4FFF] mb-6"> {/* Use theme color */}
      Story: <span className="italic">{storyTitle}</span>
     </h2>
    )}

    <Form {...form}>
     <form onSubmit={(e) => e.preventDefault()}>
      <Tabs
       value={activeTab}
       onValueChange={(v) => setActiveTab(v as ActiveTab)}
       className="space-y-6"
      >
       <TabsList className="flex flex-wrap h-auto justify-start gap-x-2 gap-y-1 sm:justify-center">
        <TabsTrigger value="parameters"><PenTool className="mr-1 h-4 w-4 flex-shrink-0" /> Story Outline</TabsTrigger>
        <TabsTrigger value="edit" disabled={!storyContent}><Edit className="mr-1 h-4 w-4 flex-shrink-0" /> Edit / Preview</TabsTrigger>
        <TabsTrigger value="voice" disabled={!storyContent}><Headphones className="mr-1 h-4 w-4 flex-shrink-0" /> Voice & Audio</TabsTrigger>
        <TabsTrigger value="share" disabled={!generatedAudioUrl}><Share2 className="mr-1 h-4 w-4 flex-shrink-0" /> Share Story</TabsTrigger>
       </TabsList>


       {/* ───────────────────────────── parameters */}
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
               onKeyDown={handleThemeKey}
              />
             </FormControl>
             <div className="flex flex-wrap gap-2 pt-2">
              {THEME_SUGGESTIONS.map((suggestion) => (
               <Button
                key={suggestion} type="button" variant="outline" size="sm"
                onClick={() => form.setValue("theme", suggestion, { shouldValidate: true })}
                className={`text-xs ${form.watch("theme") === suggestion ? 'bg-accent text-accent-foreground' : ''}`}
               >
                {suggestion}
               </Button>
              ))}
             </div>
             <FormMessage />
            </FormItem>
           )}
          />

          {/* LENGTH */}
          <FormField
           control={form.control} name="length"
           render={({ field }) => (
            <FormItem>
             <FormLabel>Approximate Length (minutes) <span className="text-red-500">*</span></FormLabel>
             <RadioGroup
              className="flex flex-wrap gap-3" value={String(field.value)}
              onValueChange={(v) => field.onChange(Number(v))}
             >
              {LENGTH_OPTIONS.map((len) => {
               const disabled = !isSubscriber && len !== 3;
               return (
                <div key={len} className="flex items-center">
                 <RadioGroupItem value={String(len)} id={`len-${len}`} disabled={disabled} />
                 <Label htmlFor={`len-${len}`} className={disabled ? "ml-1 cursor-not-allowed text-muted-foreground" : "ml-1 cursor-pointer"}>
                  {len}
                 </Label>
                </div>
               );
              })}
             </RadioGroup>
             {/* Prompt */}
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
           type="button"
           className="w-full bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90" // Use theme color
           disabled={generateStory.isPending || !form.formState.isValid}
           onClick={form.handleSubmit((data) => generateStory.mutate(data))}
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

       {/* ───────────────────────────── edit / preview */}
       <TabsContent value="edit">
        <Card>
         <CardHeader>
          <CardTitle>Edit & Preview Story</CardTitle>
          <CardDescription>
           Review and edit the generated story text below. The title "<span className="italic font-medium">{storyTitle || 'Generated Story'}</span>" was created by the AI.
          </CardDescription>
         </CardHeader>
         <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
           <Label htmlFor="story-editor" className="mb-1 block">Edit Text</Label>
           <Textarea
            id="story-editor" value={storyContent}
            onChange={(e) => setStoryContent(e.target.value)}
            rows={20} className="resize-y"
           />
          </div>
          <div>
           <Label className="mb-1 block">Preview</Label>
           <article className="prose prose-sm max-h-[calc(theme(space.96)_*_2)] overflow-y-auto rounded-md border bg-background p-4">
            {storyContent.split("\n").filter(p => p.trim() !== '').map((p, i) => <p key={i}>{p.replace(/^#\s+/, "")}</p>)}
           </article>
          </div>
         </CardContent>
         <CardFooter>
          <Button
           type="button" className="ml-auto bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90" // Use theme color
           onClick={() => setActiveTab("voice")} disabled={!storyContent.trim()}
          >
           Continue to Voice & Audio
          </Button>
         </CardFooter>
        </Card>
       </TabsContent>

       {/* ───────────────────────────── voice / audio */}
       <TabsContent value="voice">
        <Card>
         <CardHeader>
          <CardTitle>Add Narration</CardTitle>
          <CardDescription>
           Select a voice below to preview it and set it for narration. (Language: {watchLanguage})
          </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
          {/* Voice select buttons */}
          <div className="space-y-4">
           <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SUPPORTED_VOICES.map((v) => (
             <Button
              key={v.id} variant={selectedVoiceId === v.id ? 'default' : 'outline'} size="sm"
              onClick={() => handleVoicePreview(v.id)}
              className={`flex min-w-[100px] items-center justify-start gap-1.5 rounded-md px-3 py-2 text-left transition-all sm:min-w-[120px] ${selectedVoiceId === v.id ? 'bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90 ring-2 ring-offset-2 ring-[#4FB8FF]' : 'text-gray-700 hover:bg-gray-100'}`} // Use theme color
             >
              {selectedVoiceId === v.id ? (<Check className="h-4 w-4 flex-shrink-0" />) : (<Play className="h-4 w-4 flex-shrink-0 text-muted-foreground" />)}
              <span className="truncate">{v.label}</span>
             </Button>
            ))}
           </div>
           <audio ref={previewAudioRef} className="hidden" preload="auto" />
          </div>

          <Button
           type="button" className="w-full bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90" // Use theme color
           onClick={() => { if (storyContent && selectedVoiceId && storyId) { generateAudio.mutate({ text: storyContent, voiceId: selectedVoiceId, storyId }); } else if (!storyId) { toast({ title: "Error", description: "Story ID missing. Please generate story first.", variant: "destructive" }); } }}
           disabled={ generateAudio.isPending || !selectedVoiceId || !storyContent.trim() || !storyId || !SUPPORTED_LANGUAGES.includes(form.getValues("language"))}
          >
           {generateAudio.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…(~60s)</>
           ) : (
            <><Mic className="mr-2 h-4 w-4" /> Generate Narration</>
           )}
          </Button>

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

       {/* ───────────────────────────── share */}
       <TabsContent value="share">
        <Card>
         <CardHeader>
          <CardTitle>Share Your Story: <span className="italic">{storyTitle || 'Generated Story'}</span></CardTitle>
          <CardDescription>Listen, copy link, download, or open your narrated story.</CardDescription>
         </CardHeader>
         <CardContent>
          <div className="flex flex-wrap justify-center gap-4">
           {/* Play / Pause */}
           <Button
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            className="flex items-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition-colors w-full sm:w-auto bg-[#4FB8FF] text-white hover:bg-[#4FB8FF]/90" // Use theme color
            onClick={handlePlayPause} disabled={!generatedAudioUrl || generateAudio.isPending}
           >
            {isPlaying ? (<PauseCircle className="h-6 w-6" />) : (<PlayCircle className="h-6 w-6" />)}
            {isPlaying ? 'Pause' : 'Play'}
           </Button>

           {/* Copy link */}
           <Button
            aria-label="Copy link"
            className="flex items-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition-colors w-full sm:w-auto border-2 border-[#4FB8FF] bg-white text-[#4FB8FF] hover:bg-[#4FB8FF] hover:text-white" // Use theme color
            onClick={handleCopyLink} disabled={!generatedAudioUrl || generateAudio.isPending}
           >
            <CopyIcon className="h-6 w-6" /> Copy
           </Button>

           {/* Download */}
           <Button
            aria-label="Download MP3"
            className="flex items-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition-colors w-full sm:w-auto border-2 border-[#4FB8FF] bg-white text-[#4FB8FF] hover:bg-[#4FB8FF] hover:text-white" // Use theme color
            onClick={handleDownload} disabled={!generatedAudioUrl || generateAudio.isPending}
           >
            <DownloadIcon className="h-6 w-6" /> Download
           </Button>

           {/* Open in new tab */}
           <Button
            aria-label="Open in new tab"
            className="flex items-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition-colors w-full sm:w-auto border-2 border-[#4FB8FF] bg-white text-[#4FB8FF] hover:bg-[#4FB8FF] hover:text-white" // Use theme color
            onClick={handleOpen} disabled={!generatedAudioUrl || generateAudio.isPending}
           >
            <LinkIcon className="h-6 w-6" /> Open
           </Button>
          </div>
         </CardContent>
         <CardFooter>
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