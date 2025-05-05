'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  PenTool,
  Mic,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/* -------------------------------------------------------------------------- */
/*  Demo-only featured stories (replace with real content or fetch).          */
/* -------------------------------------------------------------------------- */
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

/* =============================================================================
   Component
============================================================================= */
export default function HomeClient() {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement | null>>(new Map());

  const { user } = useAuth();   // supabase not needed in this component

  /* ---------------- audio helpers ---------------- */
  const setAudioRef = (id: string, el: HTMLAudioElement | null) => {
    if (el) audioRefs.current.set(id, el);
    else audioRefs.current.delete(id);
  };

  const togglePlay = (id: string) => {
    const current = audioRefs.current.get(id);
    const isPlaying = playingAudioId === id;

    // pause anything else
    audioRefs.current.forEach((el, audioId) => {
      if (audioId !== id && el && !el.paused) el.pause();
    });

    if (!current) return;

    if (isPlaying) {
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
        .catch(console.error);
    }
  };

  // Pause everything on unmount
  useEffect(
    () => () => {
      audioRefs.current.forEach((el) => el?.pause());
    },
    [],
  );

  /* ---------------- render ------------------------ */
  return (
    <>
      {/* ================================================================== */}
      {/*  HOW IT WORKS                                                     */}
      {/* ================================================================== */}
      <section
        id="how-it-works"
        className="py-20 bg-white scroll-mt-20 border-t border-gray-100"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-[#8A4FFF]">
              How StoryTime Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Creating personalized, narrated stories is simple and fun. Follow
              these easy steps:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <Step
              num={1}
              title="Outline Your Story"
              Icon={PenTool}
              bg="bg-[#D6F4FF]"
              color="text-[#4FB8FF]"
              desc="Choose the theme, characters, and learning focus."
            />
            <Step
              num={2}
              title="Generate Story"
              Icon={Sparkles}
              bg="bg-[#E7FCEC]"
              color="text-[#06D6A0]"
              desc="Our AI crafts a unique tale. Edit if you like."
            />
            <Step
              num={3}
              title="Add Voice"
              Icon={Mic}
              bg="bg-[#FFEAF2]"
              color="text-[#F8669E]"
              desc="Pick a narrator or record your own voice."
            />
            <Step
              num={4}
              title="Enjoy!"
              Icon={PlayCircle}
              bg="bg-[#FFF5E7]"
              color="text-[#FF9F51]"
              desc="Listen together with animated text highlighting."
            />
          </div>

          <div className="text-center mt-12">
            <Link
              href={user ? '/create-story' : '/signup'}
              className="inline-flex items-center justify-center bg-[#8A4FFF] hover:bg-[#7a3dff] text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              {user ? 'Start Creating Your Story' : 'Sign Up to Create Stories'}
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/*  FEATURED STORIES                                                  */}
      {/* ================================================================== */}
      <section className="py-20 bg-[#F2FCE2]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#8A4FFF]">
              Magical Tales
            </h2>
            <Link
              href="/stories"
              className="text-[#8A4FFF] hover:text-[#7a3dff] font-semibold whitespace-nowrap"
            >
              Explore all stories &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredStories.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl overflow-hidden shadow-md transition-shadow hover:shadow-lg flex flex-col"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={s.coverImage}
                    alt={s.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
                    {s.title}
                  </h3>

                  <div className="flex justify-end mt-auto pt-2">
                    <button
                      onClick={() => togglePlay(s.id)}
                      className="inline-flex items-center space-x-1 text-[#8A4FFF] hover:text-[#7a3dff] text-sm font-medium"
                    >
                      {playingAudioId === s.id ? (
                        <>
                          <PauseCircle className="h-6 w-6" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-6 w-6" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                  </div>

                  <audio
                    ref={(el) => setAudioRef(s.id, el)}
                    src={s.audioSrc}
                    preload="metadata"
                    onPause={() =>
                      playingAudioId === s.id && setPlayingAudioId(null)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/*  CTA STRIP                                                         */}
      {/* ================================================================== */}
      <section className="py-20 bg-gradient-to-r from-[#4FB8FF] to-[#06D6A0] text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Begin your storytelling adventure
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Join families creating magical bedtime moments with stories that
            inspire wonder and joy.
          </p>

          <Link
            href={user ? '/create-story' : '/signup'}
            className="inline-flex items-center justify-center bg-white text-[#4FB8FF] hover:bg-white/90 font-medium text-lg px-8 py-3 rounded-full shadow-lg transition-colors"
          >
            {user ? 'Create Another Story' : 'Sign Up For Your Free Story!'}
          </Link>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helper: Step Card                                                         */
/* -------------------------------------------------------------------------- */
interface StepProps {
  num: number;
  title: string;
  desc: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  bg: string;
  color: string;
}

function Step({ num, title, desc, Icon, bg, color }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center p-4">
      <div className="relative mb-5">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${bg}`}
        >
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
