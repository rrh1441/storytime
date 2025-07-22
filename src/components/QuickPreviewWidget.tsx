'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Play, Pause, Volume2 } from 'lucide-react';

const THEMES = ['Adventure', 'Friendship', 'Mystery'] as const;
type Theme = (typeof THEMES)[number];

export default function QuickPreviewWidget() {
  const [hero, setHero] = useState('');
  const [theme, setTheme] = useState<Theme>('Adventure');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const generateStory = async () => {
    if (!hero.trim()) return;
    
    setLoading(true);
    setStory(null);
    setAudioUrl(null);

    try {
      // Generate story text
      const response = await fetch('/api/quick-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero, theme }),
      });
      
      if (!response.ok) throw new Error('Failed to generate story');
      
      const { story: text } = await response.json();
      setStory(text);

      // Generate TTS
      try {
        const ttsResponse = await fetch('/api/quick-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        
        if (ttsResponse.ok) {
          const blob = await ttsResponse.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
      } catch (ttsError) {
        console.warn('TTS failed (non-fatal):', ttsError);
      }
    } catch (error) {
      console.error('Story generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioUrl) return;

    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    } else {
      const newAudio = new Audio(audioUrl);
      newAudio.onended = () => setIsPlaying(false);
      newAudio.onpause = () => setIsPlaying(false);
      newAudio.onplay = () => setIsPlaying(true);
      setAudio(newAudio);
      newAudio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="mt-8 p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#8A4FFF]" />
          Try it Out
        </h3>
        <p className="text-sm text-gray-600">
          Get a 60 second story instantly with no signup required
        </p>
      </div>

      {!story ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Hero's name (e.g., Luna)"
              value={hero}
              onChange={(e) => setHero(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A4FFF]/20 text-gray-800 placeholder-gray-500"
              maxLength={20}
            />
            
            <div className="flex gap-1 flex-wrap">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    theme === t
                      ? 'bg-[#8A4FFF] text-white border-[#8A4FFF]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#8A4FFF]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={generateStory}
            disabled={loading || !hero.trim()}
            className="w-full bg-[#8A4FFF] hover:bg-[#7a3dff] text-white rounded-lg text-sm py-2"
          >
            {loading ? 'Crafting Your Story...' : 'Generate Preview'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700 leading-relaxed">
              {story}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            {audioUrl && (
              <Button
                onClick={toggleAudio}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <Volume2 className="h-4 w-4" />
                {isPlaying ? 'Pause' : 'Listen'}
              </Button>
            )}
            
            <Button
              onClick={() => {
                window.location.href = '/signup';
              }}
              size="sm"
              className="bg-[#4FB8FF] hover:bg-[#4FB8FF]/90 text-white"
            >
              Sign Up Free
            </Button>
          </div>
          
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              Like it? Get 2 free full stories monthly!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}