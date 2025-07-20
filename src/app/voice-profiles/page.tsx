// src/app/voice-profiles/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Mic, Play, Plus, Trash, CheckCircle, Headphones, AlertCircle,
} from 'lucide-react';

/*──────────────── mock data (replace later) ───────────────*/
const mockVoiceProfiles = [
  { id: '1', name: 'My Reading Voice',    createdAt: '2 months ago', isDefault: true },
  { id: '2', name: 'Bedtime Story Voice', createdAt: '3 weeks ago',  isDefault: false },
];

const mockVoiceSamples = [
  { id: '1', name: 'Sarah (Professional Female)',   description: 'Warm and friendly female voice with American accent', isPremium: false },
  { id: '2', name: 'James (Professional Male)',     description: 'Clear and engaging male voice with British accent',  isPremium: false },
  { id: '3', name: 'Emma (Professional Female)',    description: 'Soft and nurturing female voice perfect for bedtime stories', isPremium: true },
  { id: '4', name: 'Michael (Professional Male)',   description: 'Energetic male voice ideal for adventure stories',  isPremium: true },
];

/*──────────────── page ───────────────────────────────────*/
export default function VoiceProfiles() {
  const [voiceProfiles, setVoiceProfiles] = useState(mockVoiceProfiles);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordingStage, setRecordingStage] = useState<0 | 1 | 2>(0);   // 0 ready, 1 recording, 2 done

  /*──── helpers ────*/
  const startRecording = () => {
    setRecordingProgress(0);
    setRecordingStage(1);
    const interval = setInterval(() => {
      setRecordingProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setRecordingStage(2);
          return 100;
        }
        return p + 10;
      });
    }, 600);
  };

  const deleteVoiceProfile = (id: string) =>
    setVoiceProfiles((cur) => cur.filter((p) => p.id !== id));

  const setDefaultVoiceProfile = (id: string) =>
    setVoiceProfiles((cur) => cur.map((p) => ({ ...p, isDefault: p.id === id })));

  const addNewVoiceProfile = (name: string) =>
    setVoiceProfiles((cur) => [
      ...cur,
      {
        id: `mock-${Date.now()}`,
        name: name || `My Voice ${cur.length + 1}`,
        createdAt: 'Just now',
        isDefault: cur.length === 0,
      },
    ]);

  const handleDialogSubmit = () => {
    const input = document.getElementById('voice-name') as HTMLInputElement | null;
    addNewVoiceProfile(input?.value ?? '');
    setRecordingStage(0);
  };

  /*──── render ────*/
  return (
    <div className="min-h-screen bg-[#F9FAFC] py-12">
      <div className="container mx-auto px-6">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">Voice Profiles</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/*───────── Your profiles ─────────*/}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Voice Profiles</h2>

                <Dialog onOpenChange={(open) => !open && setRecordingStage(0)}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center bg-[#8A4FFF] text-white hover:bg-[#7a3dff]">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Voice
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Voice Profile</DialogTitle>
                      <DialogDescription>
                        {recordingStage === 0 && 'Record a sample of your voice to create a personalized profile.'}
                        {recordingStage === 1 && 'Read the text aloud clearly.'}
                        {recordingStage === 2 && 'Processing complete.'}
                      </DialogDescription>
                    </DialogHeader>

                    {/* stage 0 */}
                    {recordingStage === 0 && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="voice-name">Voice Profile Name</Label>
                          <Input id="voice-name" placeholder="E.g., My Storytelling Voice" />
                        </div>
                        <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-4">
                          <h4 className="flex items-center font-medium text-blue-800">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Recording Tips
                          </h4>
                          <ul className="list-disc space-y-1 pl-6 text-sm text-blue-700">
                            <li>Use a quiet environment.</li>
                            <li>Speak in your natural storytelling voice.</li>
                            <li>Maintain consistent distance from mic.</li>
                            <li>Reading takes about 1&nbsp;minute.</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* stage 1 */}
                    {recordingStage === 1 && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-4 rounded-md border p-4">
                          <h4 className="text-center font-medium">Please read the following text:</h4>
                          <p className="text-sm italic text-gray-700">
                            &quot;Once upon a time in a land of endless wonder, there lived a curious child who
                            loved to explore. Every day brought new adventures and discoveries, from the tallest
                            trees to the smallest flowers. The world was full of magic for those who took the
                            time to notice the little things. And so our story begins, with a heart full of
                            courage and eyes wide open to the possibilities that await.&quot;
                          </p>
                          <div className="h-2.5 w-full rounded-full bg-gray-200">
                            <div
                              className="h-2.5 rounded-full bg-[#8A4FFF] transition-all duration-500 ease-linear"
                              style={{ width: `${recordingProgress}%` }}
                            />
                          </div>
                          <p className="text-center text-sm text-gray-500">
                            Recording… {recordingProgress}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* stage 2 */}
                    {recordingStage === 2 && (
                      <div className="space-y-4 py-4 text-center">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                        <h3 className="text-lg font-semibold">Recording Complete!</h3>
                        <p className="text-sm text-gray-600">
                          Your voice sample has been recorded successfully. We&apos;re now processing it to create
                          your voice profile (simulation).
                        </p>
                      </div>
                    )}

                    <DialogFooter>
                      {recordingStage === 0 && (
                        <Button
                          className="flex items-center bg-[#8A4FFF] text-white hover:bg-[#7a3dff]"
                          onClick={startRecording}
                        >
                          <Mic className="mr-2 h-4 w-4" />
                          Start Recording
                        </Button>
                      )}
                      {recordingStage === 1 && (
                        <Button disabled className="cursor-not-allowed bg-gray-400 text-white">
                          Recording…
                        </Button>
                      )}
                      {recordingStage === 2 && (
                        <Button
                          className="bg-green-500 text-white hover:bg-green-600"
                          onClick={handleDialogSubmit}
                        >
                          Save Voice Profile
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* profiles list */}
              {voiceProfiles.length ? (
                <div className="space-y-4">
                  {voiceProfiles.map((p) => (
                    <Card key={p.id} className="border border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{p.name}</CardTitle>
                            <CardDescription>Created {p.createdAt}</CardDescription>
                          </div>
                          {p.isDefault && (
                            <span className="flex items-center rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-[#8A4FFF]">
                              <CheckCircle className="mr-1 h-3 w-3" /> Default
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardFooter className="flex justify-between pt-2">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex items-center text-xs">
                            <Play className="mr-1 h-3 w-3" /> Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center text-xs"
                            onClick={() => setDefaultVoiceProfile(p.id)}
                            disabled={p.isDefault}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" /> Set Default
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex items-center text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => deleteVoiceProfile(p.id)}
                          disabled={p.isDefault}
                        >
                          <Trash className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed py-12 text-center text-gray-500">
                  <Headphones className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-semibold">No Voice Profiles Yet</h3>
                  <p className="mb-6">Create your first voice profile to start narrating stories!</p>
                </div>
              )}
            </div>
          </div>

          {/*───────── Professional voices & settings ─────────*/}
          <div className="space-y-6">
            <Card className="rounded-lg bg-white shadow-md">
              <CardHeader>
                <CardTitle>Professional Voices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockVoiceSamples.map((v) => (
                  <Card key={v.id} className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{v.name}</CardTitle>
                        {v.isPremium && (
                          <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Premium
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs">{v.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2">
                      <Button size="sm" variant="outline" className="flex items-center text-xs">
                        <Play className="mr-1 h-3 w-3" /> Preview
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg bg-white shadow-md">
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultVoice" className="text-sm font-medium">
                    Default Voice
                  </Label>
                  <p className="mb-2 text-xs text-gray-600">
                    Choose the default voice for new stories.
                  </p>
                  <Select defaultValue="profile:1">
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="Select default voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceProfiles.map((p) => (
                        <SelectItem key={`prof-${p.id}`} value={`profile:${p.id}`}>
                          {p.name} (Your Voice)
                        </SelectItem>
                      ))}
                      {mockVoiceSamples.map((s) => (
                        <SelectItem key={`samp-${s.id}`} value={`sample:${s.id}`}>
                          {s.name}
                          {s.isPremium ? ' (Premium)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}