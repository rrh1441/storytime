// src/app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Sparkles, PenTool, PlayCircle, PauseCircle, Mic, Leaf,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import QuickPreviewWidget from '@/components/QuickPreviewWidget';

/*──────────────── featured stories ───────────────*/
const featuredStories = [
  {
    id: 'cosmic',
    title: 'Cosmic Adventures',
    coverImage: '/Cosmic.png',
    audioSrc: '/Cosmic.mp3',
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
  },
];

/*──────────────── Step component ─────────────────*/
interface StepProps {
  num: number;
  title: string;
  desc: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bg: string;
  color: string;
}

function Step({
  num, title, desc, Icon, bg, color,
}: StepProps) {
  return (
    <div className="flex flex-col items-center p-4 text-center">
      <div className="relative mb-5">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#8A4FFF] text-xs font-bold text-white">
          {num}
        </span>
      </div>
      <h3 className={`mb-3 text-xl font-bold ${color}`}>{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

/*──────────────── Page ───────────────────────────*/
export default function Home() {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement | null>>(new Map());
  const { user } = useAuth();

  /* ref helper */
  const setAudioRef = (id: string, el: HTMLAudioElement | null) => {
    if (el) audioRefs.current.set(id, el);
    else    audioRefs.current.delete(id);
  };

  /* play / pause */
  const togglePlay = (id: string) => {
    const current = audioRefs.current.get(id);
    const isSame  = playingAudioId === id;

    /* stop all others */
    audioRefs.current.forEach((el, otherId) => {
      if (otherId !== id) el?.pause();
    });

    if (!current) return;

    if (isSame) {
      current.pause();
      setPlayingAudioId(null);
    } else {
      current
        .play()
        .then(() => {
          setPlayingAudioId(id);
          const onEnded = () => {
            setPlayingAudioId(null);
            current.removeEventListener('ended', onEnded);
          };
          current.addEventListener('ended', onEnded);
        })
        .catch((err) => {
          console.error('Audio play error:', err);
          setPlayingAudioId(null);
        });
    }
  };

  /* pause on unmount */
  useEffect(() => () => {
    audioRefs.current.forEach((el) => el?.pause());
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#F2FCE2] pt-20 pb-24 md:pb-32">
        <div className="container relative z-10 mx-auto px-6">
          <div className="flex flex-col items-center">
            <div className="mb-12 w-full text-center max-w-4xl">
              <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-[#4FB8FF] md:text-5xl lg:text-6xl">
                Your Ideas,
                <span className="block text-[#FF9F51]">Their Adventures</span>
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-lg text-[#6b7280] md:text-xl">
                Never run out of stories again. Create stories they&rsquo;ll always remember.
                Transport your kids to worlds of wonder. Try your first story free!
              </p>
              {/* Quick Preview Widget */}
              <QuickPreviewWidget />

              <div className="mt-8 flex justify-center">
                <Link href={user ? '/create-story' : '/signup'}>
                  <Button className="h-auto rounded-full bg-[#4FB8FF] px-8 py-3 text-lg font-medium text-white shadow-lg hover:bg-[#4FB8FF]/90">
                    {user ? 'Create a Story' : 'Sign Up for More Free Stories'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-gray-100 bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-[#8A4FFF] md:text-4xl">
              How StoryTime Works
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600">
              Creating personalized, narrated stories is simple and fun. Follow these easy steps:
            </p>
          </div>
          <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 lg:grid-cols-4">
            <Step
              num={1}
              title="Outline Your Story"
              Icon={PenTool}
              bg="bg-[#D6F4FF]"
              color="text-[#4FB8FF]"
              desc="Choose the theme, characters, and any educational focus."
            />
            <Step
              num={2}
              title="Generate Story"
              Icon={Sparkles}
              bg="bg-[#E7FCEC]"
              color="text-[#06D6A0]"
              desc="Our AI crafts a unique story. Review and edit the text."
            />
            <Step
              num={3}
              title="Add Voice"
              Icon={Mic}
              bg="bg-[#FFEAF2]"
              color="text-[#F8669E]"
              desc="Select a professional narrator or use your own recorded voice."
            />
            <Step
              num={4}
              title="Enjoy!"
              Icon={PlayCircle}
              bg="bg-[#FFF5E7]"
              color="text-[#FF9F51]"
              desc="Listen to the narrated story with text highlighting."
            />
          </div>
          <div className="mt-12 text-center">
            <Link href={user ? '/create-story' : '/signup'}>
              <Button size="lg" className="rounded-full bg-[#8A4FFF] font-medium text-white hover:bg-[#7a3dff]">
                {user ? 'Start Creating Your Story' : 'Sign Up to Create Stories'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured stories */}
      <section className="relative overflow-hidden bg-[#F2FCE2] py-20">
        <div className="container relative z-10 mx-auto px-6">
          <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <h2 className="text-center font-display text-3xl font-bold text-[#8A4FFF] md:text-4xl sm:text-left">
              Magical Tales
            </h2>
            <Link href="/stories" className="whitespace-nowrap font-semibold text-[#8A4FFF] hover:text-[#7a3dff]">
              Explore all stories &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {featuredStories.map((s) => (
              <div
                key={s.id}
                className="flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={s.coverImage}
                    alt={s.title}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-grow flex-col p-4">
                  <h3 className="mb-2 line-clamp-1 text-lg font-bold text-gray-800">{s.title}</h3>
                  <div className="mt-auto flex items-center justify-end pt-2 text-sm text-gray-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 p-1 text-[#8A4FFF] hover:text-[#7a3dff]"
                      onClick={() => togglePlay(s.id)}
                    >
                      {playingAudioId === s.id
                        ? <PauseCircle className="h-6 w-6" />
                        : <PlayCircle className="h-6 w-6" />}
                      <span className="text-xs font-medium">
                        {playingAudioId === s.id ? 'Pause' : 'Play'}
                      </span>
                    </Button>
                  </div>
                  <audio
                    ref={(el) => setAudioRef(s.id, el)}
                    src={s.audioSrc}
                    preload="metadata"
                    onPause={() => {
                      if (playingAudioId === s.id) setPlayingAudioId(null);
                    }}
                  >
                    <track kind="captions" />
                  </audio>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#4FB8FF] to-[#06D6A0] py-20 text-white">
        <div className="container relative z-10 mx-auto px-6 text-center">
          <h2 className="mb-6 font-display text-3xl font-bold md:text-4xl">
            Begin your storytelling adventure
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg opacity-90 md:text-xl">
            Join families creating magical bedtime moments with stories that inspire wonder and joy.
          </p>
          <Link href={user ? '/create-story' : '/signup'}>
            <Button className="h-auto rounded-full bg-white px-8 py-3 text-lg font-medium text-[#4FB8FF] shadow-lg hover:bg-white/90">
              {user ? 'Create Another Story' : 'Sign Up For Your Free Story!'}
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}