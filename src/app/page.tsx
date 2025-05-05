// src/app/page.tsx
'use client'; // Needed because we use hooks (useState, useRef, useEffect) and event handlers

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link'; // Use Next.js Link
import Image from 'next/image'; // Use Next.js Image
import { Button } from '@/components/ui/button';
import { Sparkles, PenTool, PlayCircle, PauseCircle, Mic, Leaf } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Use the Next.js Auth context

// Featured stories data (ensure these paths are correct relative to the /public folder)
const featuredStories = [
 {
  id: 'cosmic',
  title: 'Cosmic Adventures',
  coverImage: '/Cosmic.png', // Assumes image is in /public/Cosmic.png
  audioSrc: '/Cosmic.mp3',   // Assumes audio is in /public/Cosmic.mp3
 },
 {
  id: 'flying',
  title: 'The Flying Acorn Ship',
  coverImage: '/Flying.png',
  audioSrc: '/Flying.mp3',
 },
 {
  id: 'whispers',
  title: 'The Whispers of the Windwood',
  coverImage: '/Whispers.png',
  audioSrc: '/Whispers.mp3',
 }
];

// Define the Step component props (assuming Icon is a Lucide component)
// (Could be extracted to its own file: src/components/Step.tsx)
interface StepProps {
 num: number;
 title: string;
 desc: string;
 Icon: React.FC<React.SVGProps<SVGSVGElement>>; // Type for Lucide icons
 bg: string;
 color: string;
}

// Define the Step component
function Step({ num, title, desc, Icon, bg, color }: StepProps) {
 return (
  <div className="flex flex-col items-center text-center p-4">
   <div className="relative mb-5">
    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${bg}`}>
     <Icon className={`h-8 w-8 ${color}`} />
    </div>
    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#8A4FFF] text-white font-bold text-xs">
     {num}
    </span>
   </div>
   <h3 className={`text-xl font-bold mb-3 ${color}`}>{title}</h3>
   <p className="text-gray-600 text-sm">{desc}</p>
  </div>
 );
}


export default function Home() {
 const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
 const audioRefs = useRef<Map<string, HTMLAudioElement | null>>(new Map());
 const { user } = useAuth(); // Get user state from Next.js context

 // Function to manage refs
 const setAudioRef = (id: string, element: HTMLAudioElement | null) => {
  if (element) {
   audioRefs.current.set(id, element);
  } else {
   audioRefs.current.delete(id);
  }
 };

 // Function to toggle play/pause
 const togglePlay = (id: string) => {
  const currentAudio = audioRefs.current.get(id);
  const isCurrentlyPlaying = playingAudioId === id;

  // Pause any other playing audio
  audioRefs.current.forEach((audioEl, audioId) => {
   if (audioId !== id && audioEl && !audioEl.paused) {
    audioEl.pause();
   }
  });

  if (currentAudio) {
   if (isCurrentlyPlaying) {
    currentAudio.pause();
    setPlayingAudioId(null);
   } else {
    currentAudio.play().then(() => {
     setPlayingAudioId(id);
     const onEnded = () => {
      setPlayingAudioId(null);
      // Check if element still exists before removing listener
      if (audioRefs.current.get(id)) {
       currentAudio.removeEventListener('ended', onEnded);
      }
     };
     currentAudio.addEventListener('ended', onEnded);
    }).catch(err => {
     console.error("Error playing audio:", err);
     setPlayingAudioId(null); // Reset state on error
    });
   }
  }
 };

 // Cleanup effect to pause audio when component unmounts
 useEffect(() => {
  return () => {
   audioRefs.current.forEach((audioEl) => {
    audioEl?.pause();
   });
  };
 }, []);


 return (
  <>
   {/* Hero Section */}
   <section className="relative pt-20 pb-24 md:pb-32 overflow-hidden bg-[#F2FCE2]">
    <div className="container mx-auto px-6 relative z-10">
     <div className="flex flex-col lg:flex-row items-center">
      <div className="w-full lg:w-[55%] mb-12 lg:mb-0 text-center lg:text-left">
       <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight font-bold text-[#4FB8FF]">
        Your Ideas,
        <span className="block text-[#FF9F51]">Their Adventures</span>
       </h1>
       <p className="text-lg md:text-xl text-[#6b7280] mb-8 max-w-xl mx-auto lg:mx-0">
        Never run out of stories again. Create stories they'll always remember. Transport your kids to worlds of wonder. Try your first story free!
       </p>
       <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
        {/* Use Next Link */}
        <Link href={user ? "/create-story" : "/signup"}>
         <Button className="bg-[#4FB8FF] hover:bg-[#4FB8FF]/90 text-white font-medium text-lg px-8 py-3 rounded-full shadow-lg h-auto">
          {user ? "Create a Story" : "Sign Up For a Free Story"}
         </Button>
        </Link>
        {/* Use Next Link for anchor */}
        <Link href="#how-it-works" scroll={true}>
         <Button variant="outline" className="font-medium text-lg px-8 py-3 border-[#FEC6A1] text-[#FEC6A1] hover:bg-[#FEC6A1]/10 rounded-full h-auto">
          Explore the Magic
         </Button>
        </Link>
       </div>
      </div>
      <div className="w-full lg:w-[45%] relative mt-10 lg:mt-0">
       <div className="relative z-10 rounded-3xl shadow-xl overflow-hidden border-4 border-white transform rotate-1 aspect-[16/9]"> {/* Added aspect ratio */}
        {/* Use Next Image */}
        <Image
         src="/landing_image.png" // Assumes image is in /public/landing_image.png
         alt="Two children reading a magical story book outdoors"
         fill
         priority // Mark as priority as it's likely above the fold
         className="object-cover"
         sizes="(max-width: 1024px) 90vw, 45vw" // Example sizes
        />
       </div>
       {/* Decorative elements */}
       <div className="absolute -top-6 -right-6 w-32 h-32 md:w-64 md:h-64 bg-[#FFDEE2] opacity-30 rounded-full blur-3xl -z-10"></div>
       <div className="absolute -bottom-10 -left-10 w-40 h-40 md:w-72 md:h-72 bg-[#E5DEFF] opacity-40 rounded-full blur-3xl -z-10"></div>
       <div className="absolute -bottom-8 right-10 md:right-20 transform rotate-12 z-20"> <Sparkles className="h-8 w-8 md:h-12 md:w-12 text-[#FFD166]" /> </div>
       <div className="absolute top-10 -right-3 md:-right-6 transform -rotate-12 z-20"> <Leaf className="h-10 w-10 md:h-14 md:h-14 text-[#06D6A0] opacity-80" /> </div>
      </div>
     </div>
    </div>
   </section>

   {/* How It Works Section */}
   <section id="how-it-works" className="py-20 bg-white scroll-mt-20 border-t border-gray-100">
    <div className="container mx-auto px-6">
     <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-[#8A4FFF]">How StoryTime Works</h2>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">
       Creating personalized, narrated stories is simple and fun. Follow these easy steps:
      </p>
     </div>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 items-start">
      <Step num={1} title="Outline Your Story" Icon={PenTool} bg="bg-[#D6F4FF]" color="text-[#4FB8FF]" desc="Choose the theme, characters, and any educational focus." />
      <Step num={2} title="Generate Story" Icon={Sparkles} bg="bg-[#E7FCEC]" color="text-[#06D6A0]" desc="Our AI crafts a unique story. Review and edit the text." />
      <Step num={3} title="Add Voice" Icon={Mic} bg="bg-[#FFEAF2]" color="text-[#F8669E]" desc="Select a professional narrator or use your own recorded voice." />
      <Step num={4} title="Enjoy!" Icon={PlayCircle} bg="bg-[#FFF5E7]" color="text-[#FF9F51]" desc="Listen to the narrated story with text highlighting." />
     </div>
     <div className="text-center mt-12">
      <Link href={user ? "/create-story" : "/signup"}>
       <Button size="lg" className="bg-[#8A4FFF] hover:bg-[#7a3dff] text-white font-medium rounded-full">
        {user ? "Start Creating Your Story" : "Sign Up to Create Stories"}
       </Button>
      </Link>
     </div>
    </div>
   </section>

   {/* Featured Stories Section */}
   <section className="py-20 bg-[#F2FCE2] relative overflow-hidden">
    <div className="container mx-auto px-6 relative z-10">
     <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
      <h2 className="text-3xl md:text-4xl font-display font-bold text-[#8A4FFF] text-center sm:text-left">Magical Tales</h2>
      <Link href="/stories" className="text-[#8A4FFF] hover:text-[#7a3dff] font-semibold story-link whitespace-nowrap">
       Explore all stories &rarr;
      </Link>
     </div>
     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {featuredStories.map((story) => (
       <div key={story.id} className="bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg flex flex-col">
        <div className="relative aspect-[3/4] overflow-hidden">
         {/* Use Next Image */}
         <Image
          src={story.coverImage}
          alt={story.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
         />
        </div>
        <div className="p-4 flex flex-col flex-grow">
         <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{story.title}</h3>
         <div className="flex items-center justify-end mt-auto pt-2 text-sm text-gray-500">
          <Button
           variant="ghost"
           size="sm"
           className="text-[#8A4FFF] hover:text-[#7a3dff] flex items-center space-x-1 p-1 h-auto"
           onClick={() => togglePlay(story.id)}
          >
           {playingAudioId === story.id ? ( <PauseCircle className="h-6 w-6"/> ) : ( <PlayCircle className="h-6 w-6" /> )}
           <span className="text-xs font-medium">{playingAudioId === story.id ? 'Pause' : 'Play'}</span>
          </Button>
         </div>
         <audio
          ref={(el) => setAudioRef(story.id, el)}
          src={story.audioSrc}
          preload="metadata"
          onPause={() => { if(playingAudioId === story.id) setPlayingAudioId(null); }}
         >
          Your browser does not support the audio element.
         </audio>
        </div>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* CTA Section */}
   <section className="py-20 bg-gradient-to-r from-[#4FB8FF] to-[#06D6A0] text-white relative overflow-hidden">
    <div className="container mx-auto px-6 text-center relative z-10">
     <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Begin your storytelling adventure</h2>
     <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto opacity-90">
      Join families creating magical bedtime moments with stories that inspire wonder and joy.
     </p>
     <Link href={user ? "/create-story" : "/signup"}>
      <Button className="bg-white text-[#4FB8FF] hover:bg-white/90 font-medium text-lg px-8 py-3 rounded-full shadow-lg h-auto">
       {user ? "Create Another Story" : "Sign Up For Your Free Story!"}
      </Button>
     </Link>
    </div>
   </section>
  </>
 );
};