// src/components/layout/Footer.tsx
import Link from 'next/link';
import { BookOpen, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white pt-16 pb-12">
      <div className="container mx-auto px-6">
        <div className="mb-12 flex flex-col items-center text-center">
          {/* Logo + blurb */}
          <div className="mb-8">
            <Link href="/" className="mb-6 flex items-center justify-center space-x-2">
              <BookOpen className="h-6 w-6 text-[#8A4FFF]" />
              <span className="font-display text-xl font-bold text-[#4FB8FF]">
                StoryTime
              </span>
            </Link>
            <p className="text-sm text-[#6b7280] max-w-md">
              Create magical, personalized children&rsquo;s stories with AI
              assistance and bring them to life with your own voice.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/#how-it-works"
              scroll
              className="text-[#6b7280] transition-colors hover:text-[#8A4FFF]"
            >
              How It Works
            </Link>
            <Link
              href="/create-story"
              className="text-[#6b7280] transition-colors hover:text-[#8A4FFF]"
            >
              Create Story
            </Link>
            <Link
              href="/stories"
              className="text-[#6b7280] transition-colors hover:text-[#8A4FFF]"
            >
              Story Library
            </Link>
            <a
              href="mailto:support@simpleappsgroup.com"
              className="flex items-center space-x-1 text-[#6b7280] transition-colors hover:text-[#8A4FFF]"
            >
              <Mail className="h-4 w-4" />
              <span>Contact Us</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} StoryTime. All rights reserved.
            Let&rsquo;s make bedtime magical.
          </p>
        </div>
      </div>
    </footer>
  );
}