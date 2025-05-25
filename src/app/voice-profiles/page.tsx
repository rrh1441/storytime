// src/app/voice-profiles/page.tsx
'use client'; // Required for useState and event handlers

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import {
 Mic,
 Play,
 Plus,
 Trash,
 CheckCircle,
 Headphones,
 Settings,
 AlertCircle
} from 'lucide-react';

// Mock voice profiles data - TODO: Replace with actual data fetching/state management
const mockVoiceProfiles = [
 {
  id: '1',
  name: 'My Reading Voice',
  createdAt: '2 months ago',
  isDefault: true,
 },
 {
  id: '2',
  name: 'Bedtime Story Voice',
  createdAt: '3 weeks ago',
  isDefault: false,
 }
];

// Mock voice samples data - TODO: Replace with actual data fetching/state management
const mockVoiceSamples = [
 {
  id: '1',
  name: 'Sarah (Professional Female)',
  description: 'Warm and friendly female voice with American accent',
  isPremium: false,
 },
 {
  id: '2',
  name: 'James (Professional Male)',
  description: 'Clear and engaging male voice with British accent',
  isPremium: false,
 },
 {
  id: '3',
  name: 'Emma (Professional Female)',
  description: 'Soft and nurturing female voice perfect for bedtime stories',
  isPremium: true,
 },
 {
  id: '4',
  name: 'Michael (Professional Male)',
  description: 'Energetic male voice ideal for adventure stories',
  isPremium: true,
 }
];

// Removed React.FC type for simpler default export
export default function VoiceProfiles() {
 // TODO: Replace useState with fetched data and mutation logic
 const [voiceProfiles, setVoiceProfiles] = useState(mockVoiceProfiles);
 // Recording simulation state
 // const [isRecording, setIsRecording] = useState(false); // Maybe remove if unused
 const [recordingProgress, setRecordingProgress] = useState(0);
 const [recordingStage, setRecordingStage] = useState(0); // 0: Ready, 1: Recording, 2: Complete

 const startRecording = () => {
  // TODO: Implement actual browser recording logic using MediaRecorder API
  console.log("Starting recording simulation...");
  // setIsRecording(true);
  setRecordingProgress(0);
  setRecordingStage(1);

  // Simulate recording progress
  const interval = setInterval(() => {
   setRecordingProgress(prev => {
    if (prev >= 100) {
     clearInterval(interval);
     console.log("Recording simulation complete.");
     // setIsRecording(false); // Recording done
     setRecordingStage(2); // Move to complete stage
     return 100;
    }
    return prev + 10; // Faster simulation
   });
  }, 600); // Simulate 6 seconds total
 };

 const deleteVoiceProfile = (id: string) => {
  // TODO: Implement API call to delete profile
  console.log(`Simulating delete for profile ID: ${id}`);
  setVoiceProfiles(currentProfiles => currentProfiles.filter(profile => profile.id !== id));
 };

 const setDefaultVoiceProfile = (id: string) => {
  // TODO: Implement API call to set default profile
  console.log(`Simulating set default for profile ID: ${id}`);
  setVoiceProfiles(currentProfiles => currentProfiles.map(profile => ({
   ...profile,
   isDefault: profile.id === id
  })));
 };

 const addNewVoiceProfile = (name: string) => {
   // TODO: Implement API call to add profile (after successful recording/upload)
   console.log(`Simulating add new profile named: ${name}`);
   const newProfile = {
    id: `mock-${Date.now()}`, // Use a more unique mock ID
    name: name || `My Voice ${voiceProfiles.length + 1}`, // Use input name or generate one
    createdAt: 'Just now',
    isDefault: voiceProfiles.length === 0, // Make first one default
   };
   setVoiceProfiles(currentProfiles => [...currentProfiles, newProfile]);
 };

 const handleDialogSubmit = () => {
   // TODO: Get name from Input, trigger API call / actual voice processing
   const inputElement = document.getElementById('voice-name') as HTMLInputElement | null;
   const voiceName = inputElement?.value || `My Voice ${voiceProfiles.length + 1}`;
   addNewVoiceProfile(voiceName);
   setRecordingStage(0); // Reset dialog state
   // Close dialog - requires managing Dialog open state if not using form submission
 };

 return (
  <div className="min-h-screen bg-[#F9FAFC] py-12"> {/* Use theme background */}
   <div className="container mx-auto px-6">
    <h1 className="text-3xl font-bold mb-8 text-gray-800">Voice Profiles</h1>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
     {/* Your Profiles Section */}
     <div className="lg:col-span-2 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Voice Profiles</h2>
        {/* Dialog for Creating New Voice */}
        <Dialog onOpenChange={(isOpen) => !isOpen && setRecordingStage(0)}> {/* Reset stage on close */}
         <DialogTrigger asChild>
          <Button className="bg-[#8A4FFF] hover:bg-[#7a3dff] text-white flex items-center"> {/* Use theme color */}
           <Plus className="h-4 w-4 mr-2" />
           Create New Voice
          </Button>
         </DialogTrigger>
         <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
           <DialogTitle>Create New Voice Profile</DialogTitle>
           <DialogDescription>
            {recordingStage === 0 && "Record a sample of your voice to create a personalized profile."}
            {recordingStage === 1 && "Read the text aloud clearly."}
            {recordingStage === 2 && "Processing complete."}
           </DialogDescription>
          </DialogHeader>

          {/* Stage 0: Ready to Record */}
          {recordingStage === 0 && (
           <div className="space-y-4 py-4">
            <div className="space-y-2">
             <Label htmlFor="voice-name">Voice Profile Name</Label>
             <Input id="voice-name" placeholder="E.g., My Storytelling Voice" />
            </div>
            <div className="border rounded-md p-4 space-y-2 bg-blue-50 border-blue-200">
             <h4 className="font-medium flex items-center text-blue-800">
              <AlertCircle className="h-4 w-4 mr-2" /> Recording Tips
             </h4>
             <ul className="text-sm text-blue-700 space-y-1 pl-6 list-disc">
              <li>Use a quiet environment.</li>
              <li>Speak in your natural storytelling voice.</li>
              <li>Maintain consistent distance from mic.</li>
              <li>Reading takes about 1 minute.</li>
             </ul>
            </div>
           </div>
          )}

          {/* Stage 1: Recording */}
          {recordingStage === 1 && (
           <div className="space-y-4 py-4">
            <div className="border rounded-md p-4 space-y-4">
             <h4 className="font-medium text-center">Please read the following text:</h4>
             <p className="text-gray-700 italic text-sm">
              &quot;Once upon a time in a land of endless wonder, there lived a curious child who loved to explore. Every day brought new adventures and discoveries, from the tallest trees to the smallest flowers. The world was full of magic for those who took the time to notice the little things. And so our story begins, with a heart full of courage and eyes wide open to the possibilities that await.&quot;
             </p>
             <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-[#8A4FFF] h-2.5 rounded-full transition-all duration-500 ease-linear" style={{ width: `${recordingProgress}%` }}></div>
             </div>
             <p className="text-center text-sm text-gray-500">
              Recording... {recordingProgress}%
             </p>
            </div>
           </div>
          )}

          {/* Stage 2: Complete */}
          {recordingStage === 2 && (
           <div className="space-y-4 py-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" /> {/* Use theme color */}
            <h3 className="font-semibold text-lg">Recording Complete!</h3>
            <p className="text-gray-600 text-sm">
             Your voice sample has been recorded successfully. We're now processing it to create your voice profile (simulation).
            </p>
           </div>
          )}

          <DialogFooter>
           {recordingStage === 0 && (
            <Button onClick={startRecording} className="bg-[#8A4FFF] hover:bg-[#7a3dff] text-white flex items-center"> <Mic className="h-4 w-4 mr-2" /> Start Recording </Button>
           )}
           {recordingStage === 1 && ( <Button disabled className="bg-gray-400 text-white cursor-not-allowed"> Recording... </Button>)}
           {/* Allow closing after completion, or trigger final creation step */}
           {recordingStage === 2 && (
             <Button onClick={handleDialogSubmit} className="bg-green-500 hover:bg-green-600 text-white"> Save Voice Profile </Button>
           )}
          </DialogFooter>
         </DialogContent>
        </Dialog>
       </div>

       {/* List Existing Profiles */}
       {voiceProfiles.length > 0 ? (
        <div className="space-y-4">
         {voiceProfiles.map((profile) => (
          <Card key={profile.id} className="border border-gray-200">
           <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
             <div>
              <CardTitle className="text-lg">{profile.name}</CardTitle>
              <CardDescription>Created {profile.createdAt}</CardDescription>
             </div>
             {profile.isDefault && (
              <div className="bg-purple-100 text-[#8A4FFF] text-xs font-medium px-2.5 py-1 rounded-full flex items-center"> {/* Use theme color */}
               <CheckCircle className="h-3 w-3 mr-1" /> Default
              </div>
             )}
            </div>
           </CardHeader>
           <CardFooter className="pt-2 flex justify-between">
            <div className="flex space-x-2">
             <Button size="sm" variant="outline" className="flex items-center text-xs"><Play className="h-3 w-3 mr-1" /> Preview</Button>
             <Button size="sm" variant="outline" className="flex items-center text-xs" onClick={() => setDefaultVoiceProfile(profile.id)} disabled={profile.isDefault}><CheckCircle className="h-3 w-3 mr-1" /> Set Default</Button>
            </div>
            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs" onClick={() => deleteVoiceProfile(profile.id)} disabled={profile.isDefault}> <Trash className="h-3 w-3 mr-1" /> Delete</Button>
           </CardFooter>
          </Card>
         ))}
        </div>
       ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-500">
         <Headphones className="h-12 w-12 text-gray-400 mx-auto mb-4" />
         <h3 className="text-lg font-semibold mb-2">No Voice Profiles Yet</h3>
         <p className="mb-6">Create your first voice profile to start narrating stories!</p>
        </div>
       )}
      </div>
     </div>

     {/* Professional Voices & Settings Section */}
     <div className="space-y-6">
      <Card className="bg-white rounded-lg shadow-md">
       <CardHeader><CardTitle>Professional Voices</CardTitle></CardHeader>
       <CardContent className="space-y-4">
        {mockVoiceSamples.map((voice) => (
         <Card key={voice.id} className="border border-gray-200">
          <CardHeader className="pb-2">
           <div className="flex justify-between items-start">
            <CardTitle className="text-base">{voice.name}</CardTitle>
            {voice.isPremium && (<span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Premium</span>)}
           </div>
           <CardDescription className="text-xs">{voice.description}</CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
           <Button size="sm" variant="outline" className="flex items-center text-xs"><Play className="h-3 w-3 mr-1" /> Preview</Button>
          </CardFooter>
         </Card>
        ))}
       </CardContent>
      </Card>

      <Card className="bg-white rounded-lg shadow-md">
       <CardHeader><CardTitle>Voice Settings</CardTitle></CardHeader>
       <CardContent className="space-y-4">
        <div>
         <Label htmlFor="defaultVoice" className="text-sm font-medium">Default Voice</Label>
         <p className="text-xs text-gray-600 mb-2">Choose the default voice for new stories.</p>
         <Select defaultValue="profile:1">
          <SelectTrigger className="w-full h-9 text-xs"><SelectValue placeholder="Select default voice" /></SelectTrigger>
          <SelectContent>
           {/* Dynamically populate from state + samples */}
           {voiceProfiles.map(p => <SelectItem key={`prof-${p.id}`} value={`profile:${p.id}`}>{p.name} (Your Voice)</SelectItem>)}
           {mockVoiceSamples.map(s => <SelectItem key={`samp-${s.id}`} value={`sample:${s.id}`}>{s.name}{s.isPremium ? " (Premium)" : ""}</SelectItem>)}
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